// public/js/main.js

/**
 * Finds a feedback element associated with a form and displays a message temporarily.
 * @param {HTMLFormElement} form - The form element that was submitted.
 * @param {string} message - The message to display.
 * @param {boolean} isError - True if the message is an error, false otherwise.
 */
function showFeedback(form, message, isError = false) {
    // Find a sibling element with the class 'action-feedback' to display the message
    // You might need to adjust this selector based on your final HTML structure
    const feedbackElement = form.querySelector('.action-feedback'); // Look inside the form first
                        // || form.nextElementSibling; // Or maybe the next sibling?
  
    if (feedbackElement) {
      feedbackElement.textContent = message;
      feedbackElement.className = 'action-feedback'; // Reset classes
      if (isError) {
        feedbackElement.classList.add('error');
      } else {
        feedbackElement.classList.add('success');
      }
      feedbackElement.classList.add('visible');
  
      // Clear the message after a few seconds
      setTimeout(() => {
        feedbackElement.textContent = '';
        feedbackElement.classList.remove('visible', 'success', 'error');
      }, 3000); // Hide after 3 seconds
    } else {
      // Fallback if feedback element isn't found (or use a more global notification system)
      console.warn('Could not find feedback element for form:', form);
      // Fallback to alert if needed, though ideally the element should exist
      // alert(message);
    }
  }
  
  
  /**
   * Handles form submissions for actions like adding/removing from lists using Fetch API.
   */
  async function handleListAction(event) {
    event.preventDefault(); // Prevent default page reload
  
    const form = event.target;
    const url = form.action;
    const method = form.method.toUpperCase();
    const button = form.querySelector('button[type="submit"]');
  
    if (button) button.disabled = true; // Disable button immediately
    console.log(`DEBUG: Handling Action: ${method} ${url}`);
  
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Accept': 'application/json' },
      });
  
      let result;
      try {
          result = await response.json(); // Attempt to parse JSON response
          console.log('DEBUG: Server response JSON:', result);
      } catch (e) {
          console.error('DEBUG: Failed to parse server response as JSON.');
          result = { status: 'error', message: response.statusText || 'Invalid response from server' };
      }
  
      if (!response.ok) {
        // Use message from JSON if available, otherwise throw generic error
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
  
      // --- Provide User Feedback using showFeedback ---
      showFeedback(form, result.message || 'Action successful!', false); // Show success feedback
  
      if (result.status === 'success') {
        if (result.removedId) { // Check if it was a removal action
          const cardItemElement = form.closest('.card-item');
          if (cardItemElement) {
            cardItemElement.remove(); // Remove the element from the page
            console.log('DEBUG: Removed card item element from DOM.');
            // No need to re-enable button as the element is gone
            return; // Exit early after removal
          } else {
            console.warn('DEBUG: Could not find parent .card-item to remove visually.');
            if (button) button.textContent = 'Removed (Refresh?)'; // Update button text as fallback
          }
        } else { // Assume it was an 'add' or 'update' action
          if (button) {
            button.textContent = 'Done!';
            // Leave it disabled after successful add
          }
        }
      } else if (result.status === 'neutral') { // Handle neutral status ('already exists')
         if (button) {
           button.textContent = 'Done!'; // Or specific text like 'Already Added'
           // Leave it disabled
         }
      }
      // If it wasn't a removal, the button remains disabled with "Done!" text
  
    } catch (error) {
      console.error('DEBUG: Error performing list action:', error);
      showFeedback(form, `Error: ${error.message}`, true); // Show error feedback
      if (button) button.disabled = false; // Re-enable button on error
    }
  }
  
  
  // --- Event Listeners ---
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DEBUG: DOM fully loaded and parsed');
  
    const cardGridContainer = document.getElementById('card-grid-container');
    const searchInput = document.getElementById('card-search-input');
    let debounceTimer;
  
    // Log element findings
    if (searchInput) { console.log('DEBUG: Search input element found.'); }
    else { console.error('DEBUG: Search input #card-search-input NOT found!'); }
    if (cardGridContainer) { console.log('DEBUG: Card grid container element found.'); }
    else { console.error('DEBUG: Card grid container #card-grid-container NOT found!'); }
  
    // --- Live Search Input Listener ---
    if (searchInput && cardGridContainer) {
        const isLoggedIn = !!document.querySelector('a[href="/auth/logout"]');
        console.log(`DEBUG: isLoggedIn detected as: ${isLoggedIn}`);
  
        searchInput.addEventListener('input', (event) => {
            console.log('DEBUG: Search input event fired!');
            const searchTerm = event.target.value;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                console.log(`DEBUG: Debounce timer fired. Searching for: ${searchTerm}`);
                try {
                    const url = `/api/cards?search=${encodeURIComponent(searchTerm)}`;
                    console.log(`DEBUG: Fetching URL: ${url}`);
                    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
                    console.log(`DEBUG: Fetch response status: ${response.status}`);
                    if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                    const result = await response.json();
                    console.log('DEBUG: Fetch response data:', result);
                    if (result.status === 'success') {
                        renderCardGrid(result.cards, cardGridContainer, isLoggedIn);
                    } else {
                        console.error('DEBUG: API returned non-success status:', result.message);
                        cardGridContainer.innerHTML = `<p>${result.message || 'Error loading cards.'}</p>`;
                    }
                } catch (error) {
                    console.error('DEBUG: Error fetching search results:', error);
                    cardGridContainer.innerHTML = `<p>Error loading search results: ${error.message}</p>`;
                }
            }, 500);
        });
    }
  
    // --- Event Delegation for Action Forms ---
    document.body.addEventListener('submit', (event) => {
         const form = event.target;
         const formClasses = [
             'add-collection-form', 'add-want-form', 'add-trade-form',
             'remove-collection-form', 'remove-trade-form', 'remove-want-form'
         ];
         if (form && form.tagName === 'FORM' && formClasses.some(cls => form.classList.contains(cls))) {
              console.log(`DEBUG: Delegated submit event caught for form with action: ${form.action}`);
              handleListAction(event);
         }
    });
  
    console.log('DEBUG: Event listeners attached (delegation + search).');
  });
  
  // --- Render Card Grid Function (Moved for clarity) ---
  /**
   * Renders the card grid based on card data array
   * @param {Array} cards - Array of card objects
   * @param {HTMLElement} gridContainer - The container element to render into
   * @param {boolean} isLoggedIn - Whether the user is currently logged in
   */
  function renderCardGrid(cards, gridContainer, isLoggedIn) {
      console.log('DEBUG: renderCardGrid called with', cards?.length, 'cards.');
      gridContainer.innerHTML = ''; // Clear existing content
      console.log('DEBUG: Grid container cleared.');
  
      if (!cards || cards.length === 0) {
          gridContainer.innerHTML = '<p>No cards found matching search.</p>';
          console.log('DEBUG: Rendered "No cards found" message.');
          return;
      }
  
      cards.forEach(card => {
          const cardItem = document.createElement('div'); cardItem.className = 'card-item';
          const infoDiv = document.createElement('div');
          if (card.image_url) { const img = document.createElement('img'); img.src = card.image_url; img.alt = card.card_name; infoDiv.appendChild(img); }
          else { const noImg = document.createElement('p'); noImg.textContent = '(No Image)'; infoDiv.appendChild(noImg); }
          const nameP = document.createElement('p'); const nameStrong = document.createElement('strong'); nameStrong.textContent = card.card_name; nameP.appendChild(nameStrong); infoDiv.appendChild(nameP);
          const setP = document.createElement('p'); setP.textContent = `${card.set_name || ''} - ${card.card_number || ''}`; infoDiv.appendChild(setP);
          const rarityP = document.createElement('p'); rarityP.textContent = `Rarity: ${card.rarity || ''}`; infoDiv.appendChild(rarityP);
  
          const buttonsDiv = document.createElement('div');
          if (isLoggedIn) {
              const addCollectionForm = document.createElement('form'); addCollectionForm.className = 'add-collection-form'; addCollectionForm.action = `/collection/add/${card.id}`; addCollectionForm.method = 'POST'; addCollectionForm.style.display = 'inline';
              const addCollectionButton = document.createElement('button'); addCollectionButton.type = 'submit'; addCollectionButton.className = 'collection-button'; addCollectionButton.textContent = 'Add to Collection';
              addCollectionForm.appendChild(addCollectionButton); buttonsDiv.appendChild(addCollectionForm);
              // Add placeholder for feedback message inside the form
              const feedbackSpanC = document.createElement('span'); feedbackSpanC.className = 'action-feedback'; addCollectionForm.appendChild(feedbackSpanC);
  
  
              const addWantForm = document.createElement('form'); addWantForm.className = 'add-want-form'; addWantForm.action = `/wantlist/add/${card.id}`; addWantForm.method = 'POST'; addWantForm.style.display = 'inline';
              const addWantButton = document.createElement('button'); addWantButton.type = 'submit'; addWantButton.className = 'want-button'; addWantButton.textContent = 'Add to Want List';
              addWantForm.appendChild(addWantButton); buttonsDiv.appendChild(addWantForm);
               // Add placeholder for feedback message inside the form
              const feedbackSpanW = document.createElement('span'); feedbackSpanW.className = 'action-feedback'; addWantForm.appendChild(feedbackSpanW);
          }
  
          cardItem.appendChild(infoDiv); cardItem.appendChild(buttonsDiv); gridContainer.appendChild(cardItem);
      });
      console.log(`DEBUG: Appended ${cards.length} card items to grid container.`);
  }
  
  
  console.log('DEBUG: main.js loaded');
  