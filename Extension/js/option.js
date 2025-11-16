// Saves options to chrome.storage

//<div class="block">
//<a style="vertical-align:middle">Highlight color</a>
//<input type="text" id="like3">
//</div>


// Download file for exporiting json data  
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}


function export_account() {
	var ExportData = {};
	var statusEl = document.getElementById('status');
	if (statusEl) statusEl.innerText = 'Exportando...';

	// Get all relevant keys in one call and validate before exporting
	chrome.storage.local.get(['aqwitems','aqwbuy','aqwcategory','aqwwhere','aqwtype'], function(result){
		var Items = result.aqwitems || [];
		var Buy = result.aqwbuy || [];
		var Category = result.aqwcategory || [];
		var Where = result.aqwwhere || [];
		var Type = result.aqwtype || [];

		// Detect empty or uninitialized storage (common default used in older code)
		if (!Items || Items.length === 0 || (Items.length === 1 && Items[0] === null)) {
			if (statusEl) statusEl.innerText = 'Nenhum item encontrado no storage. Visite a página de inventário e atualize a extensão antes de exportar.';
			return;
		}

		for (var i = 0; i < Items.length; i++) {
			var key = Items[i];
			if (key === null || key === undefined) continue;
			ExportData[key] = [Buy[i] !== undefined ? Buy[i] : null,
				Category[i] !== undefined ? Category[i] : null,
				Where[i] !== undefined ? Where[i] : null,
				Type[i] !== undefined ? Type[i] : null];
		}

		var data = JSON.stringify(ExportData);
		download(data, "AccountData.json", 'text/plain');
		if (statusEl) statusEl.innerText = 'Exportação concluída: ' + Object.keys(ExportData).length + ' items.';
	});
	

}


function save_options() {
  var Dark_Mode = document.getElementById('dark_mode').checked;
  chrome.storage.local.set({"darkmode": Dark_Mode}, function() {});
  var WIP_moreinfo = document.getElementById('like').checked;
  chrome.storage.local.set({"wipmoreinfo": WIP_moreinfo}, function() {});	
}

function restore_options() {
  chrome.storage.local.get({wipmoreinfo: 1}, function(result){
	document.getElementById('like').checked = result.wipmoreinfo 
   })

   chrome.storage.local.get({darkmode: 0}, function(result){
	document.getElementById('dark_mode').checked = result.darkmode
   })
		

}

document.addEventListener('DOMContentLoaded', restore_options);

document.getElementById('save').addEventListener('click',
    save_options);
	
document.getElementById('export').addEventListener('click',
    export_account);