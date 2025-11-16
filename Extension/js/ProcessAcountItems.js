// ProcessAccountItems.js


function getJson(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); 
	xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText)
}




var json_data = getJson(chrome.runtime.getURL("data/Unidentified_Translation.json"))




var _UndArray_0 = json_data["Names"]
var _UndArray_1 = json_data["Translation"]
  



// Translates unidentified items 
function translateUnidentified(itemname) {
	if (itemname.includes("unidentified")) {
		for (var x = 0; x < _UndArray_0.length; x++) {
			if (itemname == _UndArray_0[x]) {
				return _UndArray_1[x];
			}
		}
	}
	return itemname;
}

// Normalize item name: remove quantities and standardize case
function normalizeItemName(itemname) {
	// Remove " x{number}" pattern (quantity indicator)
	let normalized = String(itemname).split(" x")[0].trim();
	return normalized;
}

	
// Processes items from account 
function ProcessAccountItems() {
		// Stored data for return to main 
		var Items = []
		var Where = []
		var Type = []
		var Buy = []
		var Category = [] 
		
		// Indicator of loaded items bellow search input.
		var indicator = document.createElement("div");
		
		indicator.innerHTML = "<h>Loaded 0 Items</h>";
		indicator.style = "display: block;width: auto;text-align: right;position:relative;";
		indicator.classList.add("tblHeader");
		// Append indicator only if element exists; fallback to sensible locations to avoid exceptions
		var listFilterEl = document.getElementById("listinvFull_filter");
		if (listFilterEl) {
			listFilterEl.appendChild(indicator);
		} else {
			// Try inserting before the inventory table if possible
			var invFullEl = document.getElementById("listinvFull");
			if (invFullEl && invFullEl.parentNode) {
				invFullEl.parentNode.insertBefore(indicator, invFullEl);
			} else {
				// Last resort: append to body so indicator still exists but doesn't crash
				document.body.appendChild(indicator);
			}
		}
		
		// Get all table elements 
		var inventoryElement = document.getElementsByTagName("td");
		
		// Counter for recgonizing row of table 
		var count = 0;
		
		// Loop Througth Table Elements 
		for (var x = 0; x < inventoryElement.length; x++) {
			count += 1;
			
			// Current Table Element 
			let iterated = inventoryElement[x].innerHTML.trim().replace("’","'");
			
		//  Count 1 == Item Name 
			if (count == 1) {
				iterated = iterated
				// Guard access to next cell (can be undefined at end of table)
				let type = "";
				if (inventoryElement[x+1] && typeof inventoryElement[x+1].innerHTML === 'string') {
					type = inventoryElement[x+1].innerHTML.trim().replace("'","'");
				}
				
				// Normalize the item name (remove quantity if present)
				let normalizedItem = normalizeItemName(iterated);
				
				if (iterated.includes(" x")) { // Checks if item has count (stackable items)
					// For items with quantity, store as lowercase
					Items.push(normalizedItem.toLowerCase());
				} else if (type == "Item" || type == "Resource" || type == "Quest Item" || type == "Wall Item" || type == "Floor Item")  {
					// For standard types, store as-is
					Items.push(normalizedItem);
				} else {
					// For unidentified items, translate and normalize to lowercase
					Items.push(translateUnidentified(normalizedItem.toLowerCase()));
				}
			}
			
			// Count 2 == Type 
			else if (count == 2) {
				
				// Checks type of item if its one of stackable.
				if (iterated == "Item" || iterated == "Resource" || iterated == "Quest Item" || iterated == "Wall Item" || iterated == "Floor Item") {

					// Gets the last item added to Items array
					let itemname = Items.pop(); 
					
					// If it has xAmount it will process the amount 
					if (inventoryElement[x-1] && inventoryElement[x-1].innerHTML.includes(" x")) {
						// Original item text has quantity
						let originalWithQuantity = inventoryElement[x-1].innerHTML.trim().replace("'","'");
						let itemNameOnly = normalizeItemName(originalWithQuantity);
						
						// Extract the quantity
						let quantity = "1";
						if (originalWithQuantity.includes(" x")) {
							quantity = originalWithQuantity.split(" x")[1];
						}
						
						// Saves Type as [Type, ItemAmount]
						Type.push([iterated, quantity]);
						
						// Store normalized, translated name (without quantity)
						Items.push(translateUnidentified(itemNameOnly.toLowerCase()));
					}
					// If it has no amount give it 1 as amount
					else {
						Type.push([iterated, 1]);
						// Re-store the item with proper translation and normalization
						Items.push(translateUnidentified(itemname.toLowerCase()));
					}
				} else {
					// Normall process of types just push value.
					let psh = inventoryElement[x].innerHTML.trim();
					Type.push(psh);
				}	
			} 
			
			// Count 3 == Where (Location of item)
			else if (count == 3) {
				Where.push(iterated);
			} 
			
			// Count 4 == Buy  (Ac/Gold)
			else if (count == 4) {
				Buy.push(iterated);
			} 
			
			// Count 5 == Category (Free / Member) 
			else if (count == 5) {
				let psh = inventoryElement[x].innerHTML.trim();
				Category.push(psh);
			}	
			else {
				// Reset Counter 
				if (count == 6) {
					count = 0;
				}
			}	
		}
	indicator.innerHTML = "<h>Loaded "+Items.length+" Items</h>"
	
	var data = [Items, Where, Type, Buy, Category]
	return data;
}

