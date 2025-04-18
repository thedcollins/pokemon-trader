// public/js/main.js

/**
 * Handles form submissions for actions like adding/removing from lists using Fetch API.
 * (This function remains the same as the previous version)
 */
async function handleListAction(event) {
    event.preventDefault();
    const form = event.target;
    const url = form.action;
    const method = form.method.toUpperCase();
    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    console.log(`DEBUG: Handling Action: ${method} ${url}`); // Log action start
  
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Accept': 'application/json' },
      });
  
      // Try parsing JSON regardless of response.ok to potentially get error messages
      let result;
      try {
          result = await response.json();
          console.log('DEBUG: Server response JSON:', result);
      } catch (e) {
          // If JSON parsing fails, create a basic error object
          console.error('DEBUG: Failed to parse server response as JSON.');
          result = { status: 'error', message: response.statusText || 'Failed to parse response' };
      }
  
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
  
      // Provide User Feedback
      alert(result.message || 'Action successful!');
  
      if (result.status === 'success') {
        if (result.removedId) {
          const cardItemElement = form.closest('.card-item');
          if (cardItemElement) {
            cardItemElement.remove();
            console.log('DEBUG: Removed card item element from DOM.');
          } else {
            console.warn('DEBUG: Could not find parent .card-item to remove visually.');
            if (button) button.textContent = 'Removed (Refresh?)';
          }
        } else {
          if (button) {
            button.textContent = 'Done!';
            // Leave disabled for add actions
          }
        }
      } else { // Handle neutral status ('already exists') or other non-error statuses
         if (button) {
           button.textContent = 'Done!';
           button.disabled = true;
         }
      }
  
    } catch (error) {
      console.error('DEBUG: Error performing list action:', error);
      alert(`Error: ${error.message}`);
       if (button) button.disabled = false; // Re-enable button on error
    }
  }
  
  
  /**
   * Renders the card grid based on card data array
   * (This function remains the same as the previous version)
   */
  function renderCardGrid(cards, gridContainer, isLoggedIn) {
      console.log('DEBUG: renderCardGrid called with', cards?.length, 'cards.'); // Log function call
      gridContainer.innerHTML = ''; // Clear existing content
      console.log('DEBUG: Grid container cleared.');
  
      if (!cards || cards.length === 0) {
          gridContainer.innerHTML = '<p>No cards found matching search.</p>';
          console.log('DEBUG: Rendered "No cards found" message.');
          return;
      }
  
      cards.forEach(card => {
          const cardItem = document.createElement('div');
          cardItem.className = 'card-item';
          const infoDiv = document.createElement('div');
          if (card.image_url) { /* ... image ... */
              const img = document.createElement('img');
              img.src = card.image_url;
              img.alt = card.card_name;
              infoDiv.appendChild(img);
          } else { /* ... no image text ... */
              const noImg = document.createElement('p');
              noImg.textContent = '(No Image)';
              infoDiv.appendChild(noImg);
          }
          const nameP = document.createElement('p'); /* ... name ... */
          const nameStrong = document.createElement('strong');
          nameStrong.textContent = card.card_name;
          nameP.appendChild(nameStrong);
          infoDiv.appendChild(nameP);
          const setP = document.createElement('p'); /* ... set/number ... */
          setP.textContent = `${card.set_name || ''} - ${card.card_number || ''}`;
          infoDiv.appendChild(setP);
          const rarityP = document.createElement('p'); /* ... rarity ... */
          rarityP.textContent = `Rarity: ${card.rarity || ''}`;
          infoDiv.appendChild(rarityP);
  
          const buttonsDiv = document.createElement('div');
          if (isLoggedIn) { /* ... Add Collection/Want forms/buttons ... */
              const addCollectionForm = document.createElement('form');
              addCollectionForm.className = 'add-collection-form'; addCollectionForm.action = `/collection/add/${card.id}`; addCollectionForm.method = 'POST'; addCollectionForm.style.display = 'inline';
              const addCollectionButton = document.createElement('button'); addCollectionButton.type = 'submit'; addCollectionButton.className = 'collection-button'; addCollectionButton.textContent = 'Add to Collection';
              addCollectionForm.appendChild(addCollectionButton); buttonsDiv.appendChild(addCollectionForm);
              const addWantForm = document.createElement('form');
              addWantForm.className = 'add-want-form'; addWantForm.action = `/wantlist/add/${card.id}`; addWantForm.method = 'POST'; addWantForm.style.display = 'inline';
              const addWantButton = document.createElement('button'); addWantButton.type = 'submit'; addWantButton.className = 'want-button'; addWantButton.textContent = 'Add to Want List';
              addWantForm.appendChild(addWantButton); buttonsDiv.appendChild(addWantForm);
          }
  
          cardItem.appendChild(infoDiv);
          cardItem.appendChild(buttonsDiv);
          gridContainer.appendChild(cardItem);
      });
      console.log(`DEBUG: Appended ${cards.length} card items to grid container.`);
  }
  
  
  // --- Event Listeners ---
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DEBUG: DOM fully loaded and parsed');
  
    const cardGridContainer = document.getElementById('card-grid-container');
    const searchInput = document.getElementById('card-search-input');
    let debounceTimer;
  
    // Log whether the elements were found
    if (searchInput) {
        console.log('DEBUG: Search input element found.');
    } else {
        console.error('DEBUG: Search input #card-search-input NOT found!');
    }
    if (cardGridContainer) {
        console.log('DEBUG: Card grid container element found.');
    } else {
        console.error('DEBUG: Card grid container #card-grid-container NOT found!');
    }
  
  
    // --- Live Search Input Listener ---
    if (searchInput && cardGridContainer) {
        const isLoggedIn = !!document.querySelector('a[href="/auth/logout"]');
        console.log(`DEBUG: isLoggedIn detected as: ${isLoggedIn}`);
  
        searchInput.addEventListener('input', (event) => {
            console.log('DEBUG: Search input event fired!'); // Log event firing
            const searchTerm = event.target.value;
            clearTimeout(debounceTimer);
  
            debounceTimer = setTimeout(async () => {
                console.log(`DEBUG: Debounce timer fired. Searching for: ${searchTerm}`); // Log debounce execution
                try {
                    const url = `/api/cards?search=${encodeURIComponent(searchTerm)}`;
                    console.log(`DEBUG: Fetching URL: ${url}`); // Log URL being fetched
                    const response = await fetch(url, {
                        headers: { 'Accept': 'application/json' }
                    });
                    console.log(`DEBUG: Fetch response status: ${response.status}`); // Log response status
  
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const result = await response.json();
                    console.log('DEBUG: Fetch response data:', result); // Log fetched data
  
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
        // Check if the submitted element is one of our action forms
         const form = event.target;
         const formClasses = [
             'add-collection-form', 'add-want-form', 'add-trade-form',
             'remove-collection-form', 'remove-trade-form', 'remove-want-form'
         ];
  
         // Check if the submitted form has one of the target classes
         if (form && form.tagName === 'FORM' && formClasses.some(cls => form.classList.contains(cls))) {
              console.log(`DEBUG: Delegated submit event caught for form with action: ${form.action}`); // Log delegated event
              handleListAction(event);
         }
    });
  
    console.log('DEBUG: Event listeners attached (delegation + search).');
  });
  
  console.log('DEBUG: main.js loaded'); // Check if script file itself is loaded
  