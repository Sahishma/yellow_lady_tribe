
function validateSlug() {
  var slugInput = document.getElementById('slug');
  var slug = slugInput.value.trim();

  // Regular expression to validate the slug (allowing lowercase letters, numbers, hyphens, and underscores)
  var slugPattern = /^[a-z0-9-_]+$/;

  if (!slugPattern.test(slug)) {
    // Display an error message
    slugInput.setCustomValidity('Invalid slug. Only lowercase letters, numbers, hyphens, underscores are allowed.');
  } else {
    // Clear the error message
    slugInput.setCustomValidity('');
  }
}
