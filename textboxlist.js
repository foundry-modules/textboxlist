$.require()
.library('mvc/controller')
.done(function(){

// Templates
$.template("textboxlist/item", '<li class="TextboxList-item"><span class="TextboxList-itemContent"><@== html @></span><a class="TextboxList-itemRemoveButton" href="javascript: void(0);"></a></li>');
$.template("textboxlist/itemContent", '<@= title @><input type="hidden" name="items" value="<@= id @>"/>');

$.Controller("TextboxList",
	{
		defaultOptions: {

			view: {
				item: 'textboxlist/item',
				itemContent: 'textboxlist/itemContent'
			},

			// Options
			unique: true,
			caseSensitive: false,
			max: null,

			// Events
			filter: null,

			"{item}": ".TextboxList-item",
			"{itemRemoveButton}": ".TextboxList-itemRemoveButton",
			"{itemContent}": ".TextboxList-itemContent",
			"{textField}": ".TextboxList-textField"
		}
	},
	function(self) {

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

		return {

		init: function() {

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

			var items = self.itemsByTitle,
				newItem = false;

			// If item is a string,
			if ($._.isString(item) && item!=="") {

				var title = item,
					key = self.getItemKey(title);

				item =
					(items.hasOwnProperty(key)) ?

						// Get existing item
						self.itemsByTitle[key] :

						// Or create a new one
						(function(){
							var item = {id: $.uid("item-"), title: title, key: self.getItemKey(title)};
							item.html = self.view.itemContent(true, item);
							newItem = true;
							return item;
						})();
			}

			// If items should be unique
			if (options.unique &&

				// and this item has already been added to the list
				(self.items.hasOwnProperty(item.id) ||

					// or item of the same title already exists
					(newItem && items.hasOwnProperty[item.key])
				)

			   )
			{
				// Then don't create this item anymore
				return null;
			}

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
			var key = (options.caseSensitive) ? item.title : item.toLowerCase();
			delete self.itemsByTitle[key];
		},

		addItem: function(item) {

			// Don't add empty title
			if (item==="") return;

			var options = self.options;

			// If we reached the maximum number of items, skip.
			var max = options.max;
			if (max!==null && self.item().length>=max) return;

			// Filter item
			item = self.filterItem(item);

			// At this point, if item if not an object, skip.
			if (!$.isPlainObject(item)) return;

			self.createItem(item);

			// Add item on to the list
			self.view.item(item)
				.insertBefore(self.textField());

			return item;
		},

		removeItem: function(id) {

			// Remove item from the list
			self.item("[data-id=" + id + "]")
				.remove();

			self.deleteItem(id);
		},

		"click": function() {

			self.textField().focus();
		},

		"{itemRemoveButton} click": function(item) {

			self.removeItem(item.data("id"));
		},

		"{textField} keydown": function(textField, event)
		{
			var keyCode = event.keyCode;

			textField.data("realEnterKey", keyCode==KEYCODE.ENTER);

			var textFieldKeydown = self.options.textFieldKeydown;

			$.isFunction(textFieldKeydown) && textFieldKeydown.call(self, textField, event);
		},

		"{textField} keypress": function(textField, event)
		{
			var keydownIsEnter = textField.data("realEnterKey"),

				// When a person enters the IME context menu,
				// the keyCode returned during keypress will
				// not be the enter keycode.
				keypressIsEnter = event.keyCode==KEYCODE.ENTER;

			textField.data("realEnterKey", keydownIsEnter && keypressIsEnter);

			var textFieldKeypress = self.options.textFieldKeypress;

			$.isFunction(textFieldKeypress) && textFieldKeypress.call(self, textField, event);
		},

		"{textField} keyup": function(textField, event)
		{
			var item = $.trim(self.textField().val());

			// Trigger custom event if exists
			var textFieldKeyup = self.options.textFieldKeyup;

			if ($.isFunction(textFieldKeyup)) {

				item = textFieldKeyup.call(self, textField, event, item);
			}

			// If item was converted into a null object,
			// this means the custom keyup event wants to "preventDefault".
			if (item===null) return;

			// Optimization for compiler
			var canRemoveItemUsingBackspace = "canRemoveItemUsingBackspace";

			switch(event.keyCode)
			{
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

							// Then remove the previous item.
							textField.prev(self.item.selector).remove();
						}
					}
					break;

				// Add new item
				case KEYCODE.ENTER:
					if (textField.data("realEnterKey"))
					{
						self.addItem(item);

						// and clear text field.
						textField.val("");
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

});
