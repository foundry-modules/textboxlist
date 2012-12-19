$.Controller("TextboxList",
	{
		defaults: {

			view: {
				item: ""
			}.

			// Options
			unique: true,
			caseSensitive: false,
			max: null,

			// Events
			filter: null,

			"{item}": ".TextboxList-item",
			"{itemRemoveButton}": ".TextboxList-itemRemoveButton",
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
			// and create the item data
			self.item().each(function(){
				var item = $(this);
				self.createItem({
					id: item.data("id"),
					title: item.data("title"),
					html: item.find(".TextboxList-itemTitle").html()
				});
			});
		},

		items: {},

		itemsByTitle: {},

		filterItem: function(item) {

			var options = self.options;

			// Use custom filter if provided
			var filterItem = options.filterItem;

			if ($.isFunction(filterItem)) {
				item = filterItem.call(self, item);
			}

			// If item is a string,
			if ($.isString(item) && item!=="") {

				var items = self.itemsByTitle,
					title = item,
					key = (options.caseSensitive) ? title : title.toLowerCase();

				item =
					(items.hasOwnProperty(key)) ? :

						// Get existing item
						self.itemsByTitle[key] :

						// Or create a new one
						{id: $.uid(), title: title, html: title}
			}

			if (options.uniqueItem && self.items.hasOwnProperty(item.id)) {

				return null;
			}

			return item;
		},

		createItem: function(item) {

			// Store to items object
			self.items[id] = item;

			// Store to itemsByTitle object
			var key = (options.caseSensitive) ? item.title : item.toLowerCase();
			self.itemsByTitle[key] = item;
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
				.before(self.textField());

			return item;
		},

		removeItem: function(id) {

			// Remove item from the list
			self.item("[data-id=" + id + "]")
				.remove();

			self.deleteItem(id);
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
			var item = $.trim(self.textField.val());

			// Trigger custom event if exists
			var textFieldKeyup = self.options.textFieldKeyup;

			if ($.isFunction(textFieldKeyUp)) {

				item = textFieldKeyUp.call(self, textField, event, item);
			}

			// If item was converted into a null object,
			// this means the custom keyup event wants to "preventDefault".
			if (item===null) return;

			switch(event.keyCode)
			{
				// Remove last added item
				case KEYCODE.BACKSPACE:
					textField.prev(self.textField.selector)
						.remove();
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
					self.populate();
			}
		}
	}}
);
