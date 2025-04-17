// public/js/main.js

/**
 * Handles form submissions for actions like adding/removing from lists using Fetch API.
 * @param {Event} event - The form submission event.
 */
async function handleListAction(event) {
    // Prevent the default form submission which causes a page reload
    event.preventDefault();
  
    const form = event.target; // The form that was submitted
    const url = form.action;   // Get the URL from the form's action attribute
    const method = form.method.toUpperCase(); // Get the method (POST)
    const button = form.querySelector('button[type="submit"]'); // Find the button early
  
    // Optional: Visually disable button immediately
    if (button) button.disabled = true;
  
    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Accept': 'application/json' // Indicate we prefer a JSON response
        },
      });
  
      // Check if the response was successful (status code 200-299)
      if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: response.statusText };
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
  
      // Parse the successful JSON response from the server
      const result = await response.json();
      console.log('Server response:', result); // Log response for debugging
  
      // --- Provide User Feedback ---
  
      if (result.status === 'success') {
        alert(result.message || 'Action successful!'); // Show success message
  
        // --- Modification Starts Here ---
        if (result.removedId) {
          // If the response includes a removedId, it was a removal action.
          // Find the closest parent element with the class 'card-item' and remove it.
          const cardItemElement = form.closest('.card-item');
          if (cardItemElement) {
            cardItemElement.remove(); // Remove the element from the page
            console.log('Removed card item element from DOM.');
          } else {
            // Button might still be disabled from earlier, but log warning
            console.warn('Could not find parent .card-item to remove visually.');
            if (button) button.textContent = 'Removed (Refresh?)'; // Indicate manual refresh might be needed
          }
        } else {
          // Otherwise, assume it was an 'add' or 'update' action.
          // Keep the button disabled and update text.
          if (button) {
            button.textContent = 'Done!';
            // Leave it disabled
          }
        }
        // --- Modification Ends Here ---
  
      } else { // Handle neutral status ('already exists') or other non-error statuses
         if (button) {
           button.textContent = 'Done!'; // Or specific text like 'Already Added'
           button.disabled = true;
         }
         alert(result.message || 'Action completed.');
      }
  
    } catch (error) {
      console.error('Error performing list action:', error);
      alert(`Error: ${error.message}`);
      // Re-enable the button if an error occurred
       if (button) button.disabled = false;
    }
  }
  
  
  // --- Event Listeners ---
  
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
  
    // Helper function to add listeners
    const addFormListener = (selector) => {
        const forms = document.querySelectorAll(selector);
        console.log(`Found ${forms.length} forms for selector: ${selector}`);
        forms.forEach(form => {
            form.addEventListener('submit', handleListAction);
        });
    };
  
    // Add listeners using specific classes
    addFormListener('form.add-collection-form');
    addFormListener('form.add-want-form');
    addFormListener('form.add-trade-form');
    addFormListener('form.remove-collection-form');
    addFormListener('form.remove-trade-form');
    addFormListener('form.remove-want-form');
  
    console.log('Event listeners attached.');
  });
  
  console.log('main.js loaded');
  