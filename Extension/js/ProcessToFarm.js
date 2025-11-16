// Guard against multiple injections and keep scope local
if (!window.__AQW_ProcessToFarmLoaded) {
    window.__AQW_ProcessToFarmLoaded = true;

    (function(){
        // Clean, single-scoped implementation of the ToFarm page

        const ac_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/aclarge.png";
        const rare_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/rarelarge.png";
        const seasonal_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/seasonallarge.png";
        const legend_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/legendlarge.png";

        function getJson(theUrl) {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", theUrl, false );
            xmlHttp.send(null);
            return JSON.parse(xmlHttp.responseText);
        }

        const items_json = getJson(chrome.runtime.getURL("data/WikiItems.json"));
        const wiki_exclude_suffixes = getJson(chrome.runtime.getURL("data/wiki_exclude_suffixes.json"));

        // Local icons (scoped)
        const PT_drop_icon = chrome.runtime.getURL("images/monster_drop.png");
        const PT_quest_icon = chrome.runtime.getURL("images/quest_icon.png");
        const PT_mergeshop_icon = chrome.runtime.getURL("images/mergeshop_icon.png");

        function safeText(x){ return x || ""; }

        function addRow(table, name, details){
            const tr = document.createElement('tr');
            const td1 = document.createElement('td');
            const td2 = document.createElement('td');
            const td3 = document.createElement('td');

            td1.innerHTML = safeText(name);

            // name/link
            if (details && details[1] && details[1][1] && details[1][1][1]){
                const linkText = details[1][1][1];
                const href = details[1][1][2] || '#';
                if (linkText !== "") td2.innerHTML = "<a href='http://aqwwiki.wikidot.com/"+href+"'>"+linkText+"</a>";
                else if (Array.isArray(linkText)) td2.innerHTML = linkText[0] || '';
            } else td2.innerHTML = 'N/A';

            // icons
            if (details && details[1] && details[1][1]){
                const kind = details[1][1][0];
                if (kind === 'Drop') td3.innerHTML += "<img style='height:20px' src='"+PT_drop_icon+"'></img>";
                if (kind === 'Quest') td3.innerHTML += "<img style='height:20px' src='"+PT_quest_icon+"'></img>";
                if (kind === 'Merge') td3.innerHTML += "<img style='height:20px' src='"+PT_mergeshop_icon+"'></img>";
            }
            if (details && details[6] && details[6][1]) td3.innerHTML += "<img style='height:20px' src='"+ac_large+"'></img>";
            if (details && details[7] && details[7][1]) td3.innerHTML += "<img style='height:20px' src='"+legend_large+"'></img>";
            if (details && details[8] && details[8][1]) td3.innerHTML += "<img style='height:20px' src='"+seasonal_large+"'></img>";

            tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
            if (table) table.appendChild(tr);
        }

        function filterItem(item_name, item_data, account_items) {
            const getChecked = id => (document.getElementById(id) ? document.getElementById(id).checked : true);
            const Filter_MonsterDrop = getChecked('Filter_MonsterDrop');
            const Filter_MergeDrop = getChecked('Filter_MergeDrop');
            const Filter_QuestDrop = getChecked('Filter_QuestDrop');
            const Filter_SeasonalItem = getChecked('Filter_SeasonalItem');
            const Filter_NormalItem = getChecked('Filter_NormalItem');

            if (!item_data) return false;

            if (item_data[1] && item_data[1][1]){
                const t = item_data[1][1][0];
                if (t === 'Drop' && !Filter_MonsterDrop) return false;
                if (t === 'Quest' && !Filter_QuestDrop) return false;
                if (t === 'Merge' && !Filter_MergeDrop) return false;
            }

            if (item_data[5] == undefined) return false;

            let cq = (item_name||'').toLowerCase();
            for (let i=0;i<wiki_exclude_suffixes['Excluded'].length;i++) cq = cq.replace(wiki_exclude_suffixes['Excluded'][i].toLowerCase(), '');

            if (account_items.includes(cq)) return false;
            if (item_data[14] === 'necklaces' || item_data[14] === 'misc-items') return false;
            if (item_data[8] && item_data[8][1] && !Filter_SeasonalItem) return false;
            if (item_data[6] && item_data[6][1] == false && !Filter_NormalItem) return false;
            if (item_data[5] && item_data[5][1] == true) return false;

            // If has drop/quest/merge, further checks
            if (item_data[1] && item_data[1][1]){
                const kind = item_data[1][1][0];
                if (kind === 'Merge'){
                    if (item_data[1][1][1].includes('Doom Merge')) return false;
                    return true;
                }
                if (kind === 'Quest'){
                    if (item_data[1][1][1] === 'Open Treasure Chests' || item_data[1][1][1] === 'Wheel of Doom') return false;
                    return true;
                }
                return true;
            }
            return false;
        }

        function reProcess_ToFarm_Page(){
            const table = document.getElementById('table-content'); if (table) table.innerHTML = '';
            process_ToFarm_Page();
        }

        function process_ToFarm_Page(){
            const item_keys = Object.keys(items_json);
            const table_element = document.getElementById('table-content');
            const avaliableItemsElement = document.getElementById('av-items');
            const accounteItemsElement = document.getElementById('ac-items');
            let av_item_count = 0, ac_item_count = 0;

            chrome.storage.local.get({aqwitems: []}, function(result){
                const account_items = result.aqwitems || [];
                ac_item_count = (result.aqwitems || []).length;
                for (let i=0;i<item_keys.length;i++){
                    const k = item_keys[i];
                    if (filterItem(k, items_json[k], account_items)){
                        addRow(table_element, k, items_json[k]);
                        av_item_count++;
                    }
                }
                if (avaliableItemsElement) avaliableItemsElement.innerHTML = 'Avaliable Items: '+av_item_count;
                if (accounteItemsElement) accounteItemsElement.innerHTML = 'Account Items: '+ac_item_count;
            });
        }

        if (window.location.href.includes('tofarm.html')){
            document.addEventListener('DOMContentLoaded', function(){
                const dropFilter = document.getElementById('bossdrop'); if (dropFilter) dropFilter.src = PT_drop_icon;
                const mergesFilter = document.getElementById('mergeshopdrop'); if (mergesFilter) mergesFilter.src = PT_mergeshop_icon;
                const questFilter = document.getElementById('questdrop'); if (questFilter) questFilter.src = PT_quest_icon;
                process_ToFarm_Page();
                const ids = ['Filter_AcItem','Filter_LegendItem','Filter_NormalItem','Filter_SeasonalItem','Filter_MonsterDrop','Filter_MergeDrop','Filter_QuestDrop'];
                ids.forEach(id=>{const el=document.getElementById(id); if(el) el.addEventListener('click', reProcess_ToFarm_Page);});
            });
        }

    })();
}
 


// Local icons to avoid clashing with other scripts that may declare global names
var PT_drop_icon = chrome.runtime.getURL("images/monster_drop.png");
var PT_quest_icon = chrome.runtime.getURL("images/quest_icon.png");
var PT_mergeshop_icon = chrome.runtime.getURL("images/mergeshop_icon.png");



function getJson(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); 
	xmlHttp.send(null);
    return JSON.parse(xmlHttp.responseText)
}

var items_json = getJson(chrome.runtime.getURL("data/WikiItems.json"))
var wiki_exclude_suffixes = getJson(chrome.runtime.getURL("data/wiki_exclude_suffixes.json"))



async function add_to_table(table,item_name,item_details, av_item_count, avaliableItemsElement){
	let tr = document.createElement("tr") 
	let td_1 = document.createElement("td")
	let td_2 = document.createElement("td")
	let td_3 = document.createElement("td")
	av_item_count+=1
	
	td_1.innerHTML = item_name
	
	if (item_details[1][1][0] == "Drop" || item_details[1][1][0] == "Quest" || item_details[1][1][0] == "Merge") {
		if  (item_details[1][1][1] !== "") {
			td_2.innerHTML = "<a href='http://aqwwiki.wikidot.com/"+item_details[1][1][2]+"'>"+item_details[1][1][1]+"</a>"
			
		} else {
			td_2.innerHTML = item_details[1][1][1][0]
		}
	} else {
		td_2.innerHTML = "N/A"
	}
	
	// Monster Drop Icon
	if (item_details[1][1][0] == "Drop") {
		td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+PT_drop_icon+"'></img>"
	}
	// Quest Icon
	if (item_details[1][1][0] == "Quest") {
		// Wrap the whole file in a guarded IIFE so multiple injections won't redeclare globals
		if (!window.__AQW_ProcessToFarmLoaded) {
			window.__AQW_ProcessToFarmLoaded = true;

			(function(){
				// Whole Wiki Pre processed using python script 

				// How it looks?
				//
				//	{Name}: [Data]
				//
				//	Data:
				//		0 - Type >> Item/Monster/Location 
				//		1 - href >> Link To Item 
				//	//      2 - >> 
				const ac_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/aclarge.png";
				const rare_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/rarelarge.png";
				const seasonal_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/seasonallarge.png";
				const legend_large = "http://aqwwiki.wdfiles.com/local--files/image-tags/legendlarge.png";

				function getJson(theUrl)
				{
					var xmlHttp = new XMLHttpRequest();
					xmlHttp.open( "GET", theUrl, false ); 
					xmlHttp.send(null);
					return JSON.parse(xmlHttp.responseText)
				}

				const items_json = getJson(chrome.runtime.getURL("data/WikiItems.json"))
				const wiki_exclude_suffixes = getJson(chrome.runtime.getURL("data/wiki_exclude_suffixes.json"))

				// Local icons to avoid clashing with other scripts that may declare global names
				const PT_drop_icon = chrome.runtime.getURL("images/monster_drop.png");
				const PT_quest_icon = chrome.runtime.getURL("images/quest_icon.png");
				const PT_mergeshop_icon = chrome.runtime.getURL("images/mergeshop_icon.png");

				async function add_to_table(table,item_name,item_details, av_item_count, avaliableItemsElement){
					let tr = document.createElement("tr") 
					let td_1 = document.createElement("td")
					let td_2 = document.createElement("td")
					let td_3 = document.createElement("td")
					av_item_count+=1
            
					td_1.innerHTML = item_name
            
					if (item_details[1][1][0] == "Drop" || item_details[1][1][0] == "Quest" || item_details[1][1][0] == "Merge") {
						if  (item_details[1][1][1] !== "") {
							td_2.innerHTML = "<a href='http://aqwwiki.wikidot.com/"+item_details[1][1][2]+"'>"+item_details[1][1][1]+"</a>"
                    
						} else {
							td_2.innerHTML = item_details[1][1][1][0]
						}
					} else {
						td_2.innerHTML = "N/A"
					}
            
					// Monster Drop Icon
					if (item_details[1][1][0] == "Drop") {
						td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+PT_drop_icon+"'></img>"
					}
					// Quest Icon
					if (item_details[1][1][0] == "Quest") {
						td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+PT_quest_icon+"'></img>"
					}
					// Merge Icon
					if (item_details[1][1][0] == "Merge") {
						td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+PT_mergeshop_icon+"'></img>"
					}
					// Ac Icon
					if (item_details[6][1] == true) {
						td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+ac_large+"'></img>"
					}
					// Legend Icon
					if (item_details[7][1] == true) {
						td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+legend_large+"'></img>"
					}
					// Seasonal Icon
					if (item_details[8][1] == true) {
						td_3.innerHTML = td_3.innerHTML + "<img style='height:20px' src='"+seasonal_large+"'></img>"
					}
            
					tr.appendChild(td_1)
					tr.appendChild(td_2)
					tr.appendChild(td_3)
					table.appendChild(tr)

				}

				function processToFarmItem(item_name,item_details,table) {
					add_to_table(table,item_name,item_details)
				}

        
				function reProcess_ToFarm_Page() {
					var table_element = document.getElementById("table-content")
					if (table_element) table_element.innerHTML = "" 
					process_ToFarm_Page()
				}

				function filterItem(item_name, item_data, account_items) {
						// Filters check boxes True/False On/Off
						var Filter_AcItem = document.getElementById("Filter_AcItem") ? document.getElementById("Filter_AcItem").checked : true;
						var Filter_LegendItem = document.getElementById("Filter_LegendItem") ? document.getElementById("Filter_LegendItem").checked : true;
						var Filter_NormalItem = document.getElementById("Filter_NormalItem") ? document.getElementById("Filter_NormalItem").checked : true;
						var Filter_SeasonalItem = document.getElementById("Filter_SeasonalItem") ? document.getElementById("Filter_SeasonalItem").checked : true;
						var Filter_MonsterDrop = document.getElementById("Filter_MonsterDrop") ? document.getElementById("Filter_MonsterDrop").checked : true;
						var Filter_MergeDrop = document.getElementById("Filter_MergeDrop") ? document.getElementById("Filter_MergeDrop").checked : true;
						var Filter_QuestDrop = document.getElementById("Filter_QuestDrop") ? document.getElementById("Filter_QuestDrop").checked : true;
                
                
						// Gets Tag exclusion from wiki_exclude_suffixes.json and make it smaller to compare with account_items 
						let cq = item_name.toLowerCase()
						for (var i = 0; i < wiki_exclude_suffixes["Excluded"].length; i++) {
							cq = cq.replace(wiki_exclude_suffixes["Excluded"][i].toLowerCase(), "")
						} 
                
                
                
						// Filter Drop Type on if any is TRUE and ITEM is of type it will return False (Skip Item) 
						if (item_data[1][1][0] == "Drop" && Filter_MonsterDrop == false) {
							return false 
						}
						if (item_data[1][1][0] == "Quest" && Filter_QuestDrop == false) {
							return false 
						}
						if (item_data[1][1][0] == "Merge" && Filter_MergeDrop == false) {
							return false 
						}
                
                
						if (item_data[5] != undefined) {
							// item_data[5] if undefined, the object isn't presentable (Item dosen't have data if its AC)
							if (account_items.includes(cq)) {
                        
								return false 
                        
							} 
							else if (item_data[14] == "necklaces" || item_data[14] == "misc-items") {
								// Exclude Misc Items and Necklaces 
								return false 
							} else if (item_data[8][1] && Filter_SeasonalItem == false) {
								// Seasonal Filter 
								return false 
							} else if (item_data[6][1] == false && Filter_NormalItem == false) { 
									// Ac Filter 
									return false             
							} 
                    
							else if (item_data[5][1] == true) { 
								// Excludes Rare Tag  
									return false             
							} 
                    
							else if (item_data[1][1][0] == "Drop" || item_data[1][1][0] == "Quest" || item_data[1][1][0] == "Merge") {
								if (item_data[1][1][0] == "Merge") {
									if (item_data[1][1][1].includes("Doom Merge")) {
										// Ignore Doom Merge 
										return false 
									} else {
										// Normal Merge Drop Item 
										return true 
									}
								} else if (item_data[1][1][0] == "Quest") {
									if (item_data[1][1][1] == "Open Treasure Chests" || item_data[1][1][1] == "Wheel of Doom") {
										// Ignore Open Chest 
										return false 
									}
									else{
										// Normal Quest Drop Item
										return true 
									}
								} else {
									// Normal Monster Drop Item 
									return true
								}
							}
							else {
								return false 
							}
						}
						else {
							// Failed to retrive item ._.
							// Fault of scraper in 99.99% of times.
						}
				}

				async function process_ToFarm_Page() {
            
					// Count of ac - account, and av - avaliable items
					var av_item_count = 0 
					var ac_item_count = 0 
            
            
            
					const item_keys = Object.keys(items_json)
            
					var table_element = document.getElementById("table-content")
            
            
					var avaliableItemsElement = document.getElementById("av-items")
					var accounteItemsElement = document.getElementById("ac-items")
					if (avaliableItemsElement) avaliableItemsElement.innerHTML = "Avaliable Items: "+av_item_count
					if (accounteItemsElement) accounteItemsElement.innerHTML = "Account Items: "+ac_item_count
            
            
					chrome.storage.local.get({aqwitems: []}, function(result){
						var account_items = result.aqwitems || []
						ac_item_count = (result.aqwitems || []).length
						for (var x = 0; x < item_keys.length; x++) {

							if (filterItem(item_keys[x], items_json[item_keys[x]], account_items)) {
								processToFarmItem(item_keys[x], items_json[item_keys[x]],table_element, av_item_count, avaliableItemsElement)
								av_item_count+= 1
							}
						}
						if (avaliableItemsElement) avaliableItemsElement.innerHTML = "Avaliable Items: "+av_item_count	
						if (accounteItemsElement) accounteItemsElement.innerHTML = "Account Items: "+ac_item_count	
                
					})
				}

				if (window.location.href.includes("tofarm.html")) {
            
					document.addEventListener('DOMContentLoaded', function(event) {
                
                
						var dropFilter = document.getElementById("bossdrop")
						if (dropFilter) dropFilter.src = PT_drop_icon
                
						var mergesFilter = document.getElementById("mergeshopdrop")
						if (mergesFilter) mergesFilter.src = PT_mergeshop_icon
                
						var questFilter = document.getElementById("questdrop")
						if (questFilter) questFilter.src = PT_quest_icon
                
                
						process_ToFarm_Page()
                
						var el;
						el = document.getElementById('Filter_AcItem'); if (el) el.addEventListener('click', reProcess_ToFarm_Page);
						el = document.getElementById('Filter_LegendItem'); if (el) el.addEventListener('click', reProcess_ToFarm_Page);
						el = document.getElementById('Filter_NormalItem'); if (el) el.addEventListener('click', reProcess_ToFarm_Page);
						el = document.getElementById('Filter_SeasonalItem'); if (el) el.addEventListener('click', reProcess_ToFarm_Page);
						el = document.getElementById('Filter_MonsterDrop'); if (el) el.addEventListener('click', reProcess_ToFarm_Page);
						el = document.getElementById('Filter_MergeDrop'); if (el) el.addEventListener('click', reProcess_ToFarm_Page);
						el = document.getElementById('Filter_QuestDrop'); if (el) el.addEventListener('click', reProcess_ToFarm_Page);
                
					})    
				}
			})();
		}
	}
}