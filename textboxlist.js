// Constants
var KEYCODE = {
	BACKSPACE: 8,
	COMMA: 188,
	DELETE: 46,
	DOWN: 40,
	ENTER: 13,
	ESCAPE: 27,
	LEFT: 37,
	RIGHT: 39,
	SPACE: 32,
	TAB: 9,
	UP: 38
};


// Templates
$.template("textboxlist/item", '<div class="textboxlist-item" data-textboxlist-item><span class="textboxlist-itemContent" data-textboxlist-itemContent>[%== html %]</span><div class="textboxlist-itemRemoveButton" data-textboxlist-itemRemoveButton><i class="ies-cancel-2"></i></a></div>');
$.template("textboxlist/itemContent", '[%= title %]<input type="hidden" name="[%= name %][]" value="[%= id %]"/>');

$.Controller("Textboxlist",
	{
		pluginName: "textboxlist",
		hostname: "textboxlist",

		defaultOptions: {

			view: {
				item: 'textboxlist/item',
				itemContent: 'textboxlist/itemContent'
			},

			plugin: {},

			// Options
			name: null,
			unique: true,
			caseSensitive: false,
			max: null,

			// Events
			filterItem: null,

			"{item}"            : "[data-textboxlist-item]",
			"{itemContent}"     : "[data-textboxlist-itemContent]",
			"{itemRemoveButton}": "[data-textboxlist-itemRemoveButton]",
			"{textField}"       : "[data-textboxlist-textField]"
		}
	},
	function(self) { return {

		init: function() {

			var textField = self.textField();

			// Make textfield expandable
			textField.autosizeInput();

			// Keep the original placeholder text value
			textField.data("placeholderText", textField.attr("placeholder"));

			// Configurable name option
			if (!self.options.name) {
				self.options.name = textField.data("textboxlistName") || "items"
			}			

			// Go through existing item
			// and reconstruct item data.
			self.item().each(function(){

				var item = $(this),
					itemContent = item.find(self.itemContent.selector);

				self.createItem({

					id: item.data("id") || (function(){
						var id = $.uid("item-");
						item.data("id", id);
						return id;
					})(),

					title: item.data("title") || $.trim(itemContent.text()),

					html: itemContent.html()
				});
			});

			// Determine if there's autocomplete
			if (self.options.plugin.autocomplete || self.element.data("query")) {
				self.addPlugin("autocomplete");
			}

			// Prevent form submission
			self.on("keypress", self.textField(), function(event){
				if (event.keyCode==KEYCODE.ENTER) return event.preventDefault();
			});
		},

		setLayout: function() {

			var textField = self.textField(),
				placeholderText = textField.data("placeholderText");

			// Don't show placeholder if there are items.
			if (self.item().length > 0) {
				placeholderText = "";
			}

			textField
				.attr("placeholder", placeholderText)
				.data("autosizeInputInstance")
				.update();
		},

		items: {},

		itemsByTitle: {},

		getItemKey: function(title){

			return (self.options.caseSensitive) ? title : title.toLowerCase();
		},

		filterItem: function(item) {

			var options = self.options;

			// Use custom filter if provided
			var filterItem = options.filterItem;

			if ($.isFunction(filterItem)) {
				item = filterItem.call(self, item);
			}

			var items = self.itemsByTitle;

			// If item is a string,
			if ($.isString(item) && item!=="") {

				var title = item,
					key = self.getItemKey(title);

				item =
					(items.hasOwnProperty(key)) ?

						// Get existing item
						self.itemsByTitle[key] :

						{
							id   : $.uid("item-"),
							title: title,
							key  : self.getItemKey(title)
						}
			}

			// This is for the name attribute for the hidden input
			item.name = item.name || self.options.name;

			// If item content is not created, then make one.
			item.html = item.html || self.view.itemContent(true, item);

			return item;
		},

		createItem: function(item) {

			// Create key for item
			item.key = self.getItemKey(item.title);

			// Store to items object
			self.items[item.id] = item;

			// Store to itemsByTitle object
			self.itemsByTitle[item.key] = item;
		},

		deleteItem: function(id) {

			var item = self.items[id];

			// Remove from items object
			delete self.items[id];

			// Remove from itemsByTitle object
			var key = (self.options.caseSensitive) ? item.title : item.title.toLowerCase();
			delete self.itemsByTitle[key];
		},

		addItem: function(item) {

			// Don't add invalid item
			if (!item) return;

			var options = self.options;

			// If we reached the maximum number of items, skip.
			var max = options.max;
			if (max!==null && self.item().length>=max) return;

			// Filter item
			item = self.filterItem(item);

			// At this point, if item if not an object, skip.
			if (!$.isPlainObject(item)) return;

			var itemEl,
				existingItemEl = self.item().filterBy("id", item.id);

			// If items should be unique,
			// and this item has already been added to the list
			if (options.unique && existingItemEl.length > 0) {				

				// then use existing item.
				itemEl = existingItemEl;
			}

			// Else create a new item
			if (!itemEl) {

				itemEl = 
					self.view.item(item)
						.attr("data-id", item.id);
			}

			self.createItem(item);

			// Add item on to the list
			itemEl.insertBefore(self.textField());

			self.trigger("addItem", [item]);

			return item;
		},

		removeItem: function(id) {

			var item = self.items[id];

			// Remove item from the list
			self.item().filterBy("id", id)
				.remove();

			self.deleteItem(id);

			self.trigger("removeItem", [item]);
		},

		clearItems: function() {

			self.item().each(function(){
				self.removeItem($(this).data("id"));
			});
		},

		getAddedItems: function() {

			var addedItems = [];

			self.item().each(function(){

				var item = $(this),
					id = item.data("id");

				addedItems.push(self.items[id]);
			});

			return addedItems;
		},

		"click": function() {
			self.textField().focus();
		},

		"{self} addItem": function() {

			self.setLayout();
		},

		"{self} removeItem": function() {

			self.setLayout();
		},

		"{itemRemoveButton} click": function(button) {

			var item = button.parents(self.item.selector);

			self.removeItem(item.data("id"));
		},

		"{textField} keydown": function(textField, event)
		{
			var keyCode = event.keyCode;

			textField.data("realEnterKey", keyCode==KEYCODE.ENTER);
		},

		"{textField} keypress": function(textField, event)
		{
			var keydownIsEnter = textField.data("realEnterKey"),

				// When a person enters the IME context menu,
				// the keyCode returned during keypress will
				// not be the enter keycode.
				keypressIsEnter = event.keyCode==KEYCODE.ENTER;

			textField.data("realEnterKey", keydownIsEnter && keypressIsEnter);

			var keyword = $.trim(self.textField().val());

			switch (event.keyCode) {

				// Add new item
				case KEYCODE.ENTER:

					if (textField.data("realEnterKey")) {

						var event = self.trigger("useItem", [keyword]),
							item = event.item;

						// If event handler did not decorate item,
						// use keyword as item.
						if (item===undefined) {
							item = keyword;
						}

						// If item was converted into a null/false object,
						// this means the custom keyup event wants to "preventDefault".
						if (item===false || item===null) return;

						self.addItem(item);

						// and clear text field.
						textField.val("");
					}
					break;
			}
		},

		"{textField} keyup": function(textField, event)
		{
			var item = $.trim(self.textField().val());

			// Optimization for compiler
			var canRemoveItemUsingBackspace = "canRemoveItemUsingBackspace";

			switch (event.keyCode) {

				// Remove last added item
				case KEYCODE.BACKSPACE:

					// If the text field is empty
					if (item==="") {

						// If this is the first time pressing the backspace key
						if (!self[canRemoveItemUsingBackspace]) {

							// Allow removal of item for subsequent backspace
							self[canRemoveItemUsingBackspace] = true;

						// If this is the subsequent time pressing the backspace key
						} else {

							// Look for the item before it
							var prevItem = textField.prev(self.item.selector);

							// If the item before it exists,
							if (prevItem.length > 0) {

								// Remove the item.
								self.removeItem(prevItem.data("id"));
							}
						}
					}
					break;

				default:
					// Reset backspace removal state
					self[canRemoveItemUsingBackspace] = false;
					break;
			}
		}
	}}
);

$(document)
	.on('click.textboxlist.data-api', '[data-textboxlist]', function(event){
		$(this).addController($.Controller.TextboxList).textField().focus();
	})
	.on('focus.textboxlist.data-api', '[data-textboxlist] [data-textboxlist-textField]', function(event){
		$(this).parents("[data-textboxlist]").addController($.Controller.TextboxList);
	});
// Textboxlist ends

// Autocomplete starts
$.template("textboxlist/menu", '<div class="textboxlist-autocomplete" data-textboxlist-autocomplete><div class="textboxlist-autocomplete-inner" data-textboxlist-autocomplete-viewport><ul class="textboxlist-menu" data-textboxlist-menu></ul></div></div>');
$.template("textboxlist/menuItem", '<li class="textboxlist-menuItem" data-textboxlist-menuItem>[%== html %]</li>');

$.Controller("Textboxlist.Autocomplete",
{
	defaultOptions: {

		view: {
			menu: "textboxlist/menu",
			menuItem: "textboxlist/menuItem"
		},

		cache: true,

		minLength: 1,

		limit: 10,

		highlight: true,

		caseSensitive: false,

		exclusive: false,

		// Accepts url, function or array of objects.
		// If function, it should return a deferred object.
		query: null,

		position: {
			my: 'left top',
			at: 'left bottom',
			collision: 'none'
		},

		filterItem: null,

		"{menu}": "[data-textboxlist-menu]",
		"{menuItem}": "[data-textboxlist-menuItem]",
		"{viewport}": "[data-textboxlist-autocomplete-viewport]"
	}
},
function(self) { return {

	init: function() {

		// Destroy controller
		if (!self.element.data(self.Class.fullName)) {

			self.destroy();

			// And reimplement on the context menu we created ourselves
			self.view.menu()
				.appendTo("body")
				.data(self.Class.fullName, true)
				.addController(self.Class, self.options);

			return;
		}

		self.textboxlist.autocomplete = self;
		self.textboxlist.pluginInstances["autocomplete"] = self;

		self.textboxlist.element
			.bind("destroyed", function(){
				self.element.remove();
			});

		self.textboxlist.textField()
			.bind("blur", function(event){

				// Allow user to select menu first
				setTimeout(function(){
					self.hide();
				}, 150);
			});

		// Set the position to be relative to the textboxlist
		self.options.position.of = self.textboxlist.element;

		self.initQuery();

		// Only reattach element when autocomplete is needed.
		self.element.detach();
	},

	initQuery: function() {

		// Determine query method
		var query = self.options.query || self.textboxlist.element.data("query");

		// TODO: Wrap up query options and pass to query URL & query function.

		// Query URL
		if ($.isUrl(query)) {

			var url = query;

			self.query = function(keyword){
				return $.ajax(url + keyword);
			}

			return;
		}

		// Query function
		if ($.isFunction(query)) {

			var func = query;

			self.query = function(keyword) {
				return func.call(self, keyword);
			}

			return;
		}

		// Query dataset
		if ($.isArray(query)) {

			var dataset = query;

			self.query = function(keyword) {

				var task = $.Deferred(),
					keyword = keyword.toLowerCase();

				// Fork this process
				// so it won't choke on large dataset.
				setTimeout(function(){

					var result = $.grep(dataset, function(item){
						return item.title.toLowerCase().indexOf(keyword) > -1;
					});

					task.resolve(result);

				}, 0);

				return task;
			}

			return;
		}
	},

	setLayout: function() {

		if (!self.hidden) {

			self.element
				.css({
					opacity: 1,
					width: self.textboxlist.element.outerWidth()
				})
				.position(self.options.position);
		}
	},

	"{window} resize": $.debounce(function() {
		self.element.css("opacity", 0);
		self.setLayout();
	}, 250),

	"{window} scroll": $.debounce(function() {
		self.element.css("opacity", 0);
		self.setLayout();
	}, 250),

	"{window} dialogTransitionStart": function() {
		self.hidden = true;
		self.element.css("opacity", 0);
	},

	"{window} dialogTransitionEnd": function() {
		self.hidden = false;
		self.setLayout();
	},

	show: function() {

		clearTimeout(self.sleep);

		self.element
			.appendTo("body")
			.show();

		self.hidden = false;

		self.setLayout();
	},

	hide: function() {

		self.element.hide();

		var menuItem = self.menuItem(),
			activeMenuItem = menuItem.filter(".active");

		if (activeMenuItem.length > 0) {
			self.lastItem = {
				keyword: $.trim(self.textboxlist.textField().val()),
				item   : activeMenuItem.data("item")
			};
		}

		menuItem.removeClass("active");

		self.render.reset();

		self.hidden = true;

		// Clear any previous sleep timer first
		clearTimeout(self.sleep);

		// If no activity within 3000 seconds, detach myself.
		self.sleep = setTimeout(function(){
			self.element.detach();
		}, 3000);
	},

	queries: {},

	populated: false,

	populate: function(keyword) {

		self.populated = false;

		var options = self.options,
			key = (options.caseSensitive) ? keyword : keyword.toLowerCase(),
			query = self.queries[key];

		var newQuery = !$.isDeferred(query) || !self.options.cache,

			runQuery = function(){

				// Query the keyword if:
				// - The query hasn't been made.
				// - The query has been rejected.
				if (newQuery || (!newQuery && query.state()=="rejected")) {

					query = self.queries[key] = self.query(keyword);
				}

				// When query is done, render items;
				query
					.done(
						self.render(function(items){
							return [items, keyword];
						})
					)
					.fail(function(){
						self.hide();
					});
			}

		// If this is a new query
		if (newQuery) {

			// Don't run until we are sure that the user is finished typing
			clearTimeout(self.queryTask);
			self.queryTask = setTimeout(runQuery, 250);

		// Else run it immediately
		} else {
			runQuery();
		}
	},

	render: $.Enqueue(function(items, keyword){

		if (!$.isArray(items)) return;

		// If there are no items, hide menu.
		if (items.length < 1) {
			self.hide();
			return;
		}

		var menu = self.menu();

		if (!self.options.cache || menu.data("keyword")!==keyword)
		{
			// Clear out menu items
			menu.empty();

			$.each(items, function(i, item){

				var filterItem = self.options.filterItem;

				if ($.isFunction(filterItem)) {
					item = filterItem.call(self, item, keyword);
				}

				// If the item is not an object, stop.
				if (!$.isPlainObject(item)) return;

				var html = item.menuHtml || item.title;

				self.view.menuItem({html: html})
					.data("item", item)
					.appendTo(menu);
			});

			menu.data("keyword", keyword);
		}

		// If we only allow adding item from suggestions
		if (self.options.exclusive) {

			// Automatically select the first item
			self.menuItem(":first").addClass("active");
		}			

		self.show();
	}),

	"{textboxlist.textField} keydown": function(textField, event) {

		// Prevent autocomplete from falling asleep.
		clearTimeout(self.sleep);

		// Get active menu item
		var activeMenuItem = self.menuItem(".active");

		if (activeMenuItem.length < 1) {
			activeMenuItem = false;
		}

		var textField = self.textboxlist.textField();		

		switch (event.keyCode) {

			// If up key is pressed
			case KEYCODE.UP:

				// Deactivate all menu item
				self.menuItem().removeClass("active");

				// If no menu items are activated,
				if (!activeMenuItem) {

					// activate the last one.
					self.menuItem(":last").addClass("active");

				// Else find the menu item before it,
				} else {

					// and activate it.
					activeMenuItem.prev(self.menuItem.selector)
						.addClass("active");
				}

				// Prevent up/down keys from changing textfield cursor position.
				event.preventDefault();
				break;

			// If down key is pressed
			case KEYCODE.DOWN:

				// Deactivate all menu item
				self.menuItem().removeClass("active");

				// If no menu items are activated,
				if (!activeMenuItem) {

					// activate the first one.
					self.menuItem(":first").addClass("active");

				// Else find the menu item after it,
				} else {

					// and activate it.
					activeMenuItem.next(self.menuItem.selector)
						.addClass("active");
				}

				// Prevent up/down keys from changing textfield cursor position.
				event.preventDefault();					
				break;

			// If escape is pressed,
			case KEYCODE.ESCAPE:

				// hide menu.
				self.hide();
				break;

			// Don't do anything when enter is pressed.
			case KEYCODE.ENTER:
				break;

			default:

				clearTimeout(self.populateTask);

				self.populateTask = setTimeout(function(){

					var keyword = $.trim(textField.val());

					// If no keyword given or keyword doesn't meet minimum query length, stop.
					if (keyword==="" || (keyword.length < self.options.minLength)) {

						self.hide();

					// Else populate suggestions.
					} else {

						self.populate(keyword);
					}
				}, 1);
				break;
		}

		// Get newly activated item
		var activeMenuItem = self.menuItem(".active");

		// If we are reaching the end of the menu cycle,
		// select textfield as a visual indication, else
		// unselect textfield and let the menu item appear selected.
		if (activeMenuItem.length < 1) {
			return;
			// textField.selectAll(); return;
		} else {
			//textField.unselect();
		}

		// Scroll menu viewport if it is out of visible area.
		self.viewport().scrollIntoView(activeMenuItem);		
	},

	"{textboxlist} useItem": function(textField, event, keyword) {

		// If we only pick items exclusively from menu,
		// set item to false first. This prevents any
		// random keyword from being added to the list.
		var exclusive = self.options.exclusive;

		if (exclusive) event.item = false;

		// If menu is not visible
		if (self.hidden) {

			// and we are in exclusive mode
			// and the last item before we hide the menu
			// matches the current keyword, 
			var lastItem = self.lastItem;

			if (exclusive && lastItem && lastItem.keyword==keyword) {

				// then we will automatically use the last
				// item as the item to be added to the list.					
				event.item = lastItem.item;
			}

			return;
		}

		// If there are activated items
		var activeMenuItem = self.menuItem(".active");

		if (activeMenuItem.length > 0) {

			// get the item data,
			var item = activeMenuItem.data("item");

			// and return the item data to the textboxlist.
			event.item = item;
		}

		// Hide the menu
		self.hide();
	},

	"{menuItem} click": function(menuItem) {

		// Hide context menu
		self.hide();

		// Add item
		var item = menuItem.data("item");
		self.textboxlist.addItem(item);

		// Get text field & clear text field
		var textField = self.textboxlist.textField().val("");

		// Refocus text field
		setTimeout(function(){

			// Due to event delegation, this needs to be slightly delayed.
			textField.focus();
		}, 150);
	},

	"{menuItem} mouseover": function(menuItem) {

		self.menuItem().removeClass("active");

		menuItem.addClass("active");
	},

	"{menuItem} mouseout": function(menuItem) {

		self.menuItem().removeClass("active");
	}
}}
);
// Autocomplete ends