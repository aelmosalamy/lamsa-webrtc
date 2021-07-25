const selectElementContents = (el) => {
	const range = document.createRange();
	range.selectNodeContents(el);

	const selection = document.getSelection();
	selection.removeAllRanges();
	selection.addRange(range);
};

export default selectElementContents;
