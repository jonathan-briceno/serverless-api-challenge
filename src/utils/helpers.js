// I need to normalize the game titles so its easier to search by game title
function normalizeGameTitle(title) {
    return title
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

module.exports = { normalizeGameTitle };
