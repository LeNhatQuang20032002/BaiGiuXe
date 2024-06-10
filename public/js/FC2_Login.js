// Function to toggle visibility of login div based on login state
function toggleLoginDiv(show) {
    var loginDiv = document.getElementById('loginDiv');
    if (!show) {
        loginDiv.style.display = 'none'; // Hide login div if logged in
    } else {
        loginDiv.style.display = 'block'; // Show login div if not logged in
    }
}
