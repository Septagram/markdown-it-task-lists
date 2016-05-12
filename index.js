// Markdown-it plugin to render GitHub-style task lists; see
//
// https://github.com/blog/1375-task-lists-in-gfm-issues-pulls-comments
// https://github.com/blog/1825-task-lists-in-all-markdown-documents

module.exports = function(md, options) {
	md.core.ruler.after('inline', 'github-task-lists', function(state) {
		var tokens = state.tokens;
		for (var i = 2; i < tokens.length; i++) {
			var todoType = todoItemType(tokens, i);
			if (todoType !== null) {
				todoify(tokens[i], state.Token);
				
				var itemClass = pluginOptions[todoType ? 'checkedItemClass' : 'uncheckedItemClass'];
				if (itemClass !== null) {
					tokens[i-2].attrJoin('class', itemClass);
				};

				if (pluginOptions.parentClass !== null) {
					tokens[parentToken(tokens, i-2)].attrJoin('class', pluginOptions.parentClass);
				};
			}
		}
	});
};

var pluginOptions = module.exports.options = {
	checkboxHtml: defaultCheckboxHtml,
	isCheckboxEnabled: false,
	checkboxClass: 'task-list-item-checkbox',
	checkedItemClass: 'task-list-item task-checked',
	uncheckedItemClass: 'task-list-item',
	parentClass: 'task-list',
};

function defaultCheckboxHtml(isChecked) {
	return 	'<input class="'+pluginOptions.checkboxClass+'" '+
		(isChecked ? 'checked=""' : '')+' '+
		(pluginOptions.isCheckboxEnabled ? '' : 'disabled=""')+
		' type="checkbox">';
}

function parentToken(tokens, index) {
	var targetLevel = tokens[index].level - 1;
	for (var i = index - 1; i >= 0; i--) {
		if (tokens[i].level === targetLevel) {
			return i;
		}
	}
	return -1;
}

function todoItemType(tokens, index) {
	return (isInline(tokens[index]) && isParagraph(tokens[index - 1]) && isListItem(tokens[index - 2]) || null)
		&& startsWithTodoMarkdown(tokens[index]);
}

function todoify(token, TokenConstructor) {
	var childToken = token.children[0];
	if (pluginOptions.checkboxHtml) {
		token.children.unshift(makeCheckbox(token, TokenConstructor));
	};
	childToken.content = childToken.content.slice(3);
	token.content = token.content.slice(3);
}

function makeCheckbox(token, TokenConstructor) {
	var checkbox = new TokenConstructor('html_inline', '', 0);
	checkbox.content = pluginOptions.checkboxHtml(startsWithTodoMarkdown(token));
	return checkbox;
}

function isInline(token) { return token.type === 'inline'; }
function isParagraph(token) { return token.type === 'paragraph_open'; }
function isListItem(token) { return token.type === 'list_item_open'; }

function startsWithTodoMarkdown(token) {
	// leading whitespace in a list item is already trimmed off by markdown-it
	if (token.content.indexOf('[ ]') === 0) return false;
	if (token.content.indexOf('[x]') === 0 || token.content.indexOf('[X]') === 0) return true;
	return null;
}
