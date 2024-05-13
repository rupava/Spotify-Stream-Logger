function removeFromExportList(uri){
    if (confirm('Are you sure you want to remove this track from the Export List?')) {
        chrome.storage.local.get('trackList', function(data) {
            let divObj = document.getElementById(`${uri}`);
            divObj.remove();
            delete data.trackList[uri];
            chrome.storage.local.set({'trackList': data.trackList});
        });
    }
}

function cleanExportList(){
    if (confirm('Are you sure you want to clear the Export List?')) {

        chrome.storage.local.get('trackList', function(data) {
            document.getElementById("export_list").innerHTML = "";
            chrome.storage.local.set({'trackList': {}});
        });
    }
}

function getTimestamp(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const formattedDateTime = `${year}-${month}-${day}_${hours}_${minutes}`;
    return formattedDateTime;
}

function dataSerializer(data){
    let serialised = []
    if (!data) {
        return false;
    }
    let keysMain = Object.keys(data);
    for (let i = 0; i < keysMain.length; i++) {
        const obj = data[keysMain[i]];
        let final_obj = {
            "ID":keysMain[i],
            "Track Name":obj.name,
            "Artists": obj.artists.items.map(item => item.profile.name).join(", "),
            "Streams":obj.playcount,
        }
        serialised.push(final_obj);
    }
    return serialised;
}

function saveAsExcel(buffer, filename){
    const data = new Blob([buffer], {type: EXCEL_TYPE});
    saveAs(data, filename+EXCEL_EXTENSION);
}

function downloadAsExcel(){
    chrome.storage.local.get('trackList', function(data) {
        const final_data = dataSerializer(data.trackList);
        if(final_data == false){
            alert("Cannot download empty list.");
            return false;
        }
        const timestamp = getTimestamp();
        const worksheet = XLSX.utils.json_to_sheet(final_data);
        const workbook = {
            Sheets: {
                'data' : worksheet
            },
            SheetNames: ['data']
        };
        const excelBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
        saveAsExcel(excelBuffer, `Spotify_StreamLog_${timestamp}`);
    });
}

function export_list_load(){
    chrome.storage.local.get('trackList', function(data) {
        if (!data.trackList) {
            data.trackList = {};
        }
        let trackList = data.trackList
        
        let keysList = Object.keys(trackList)

        for (let i = 0; i < keysList.length; i++) {
            const newDiv = document.createElement("div");
            newDiv.id = `${keysList[i]}`;
            newDiv.classList.add('d-flex','justify-content-between','trackSheet','p-1','m-1');
            newDiv.innerHTML = `
            <div>${trackList[keysList[i]].name}</div>
            <div>${numberCommas(trackList[keysList[i]].playcount)}</div>
            `
            newDiv.addEventListener('click', function() {
                removeFromExportList(keysList[i]);
            });
            document.getElementById("export_list").appendChild(newDiv);
        }
    
    });

    let backToCollection = document.getElementById("backBtn");
    let cleanBtn = document.getElementById("cleanBtn");
    let exportBtn = document.getElementById("exportBtn");

    backToCollection.addEventListener('click', function(){
        changePages("album_track");
    });

    cleanBtn.addEventListener('click', function(){
        cleanExportList();
    });

    exportBtn.addEventListener('click', function(){
        downloadAsExcel();
    });
}

export_list_load();