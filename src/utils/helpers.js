// I need to normalize the game titles and platforms so its easier to search by game title and apply validations
function normalizeText(text) {
    return text
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

module.exports = { normalizeText };
