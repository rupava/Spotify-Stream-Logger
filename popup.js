const albumTypeObj = document.getElementById('albumType');
const albumNameObj = document.getElementById('albumName');
const trackViewObj = document.getElementById("tracks");
const sheetTrackViewObj = document.getElementById("sheet_tracks");
const bodyObj = document.getElementById("body");
const popup_main = document.getElementById("popup_main");
const sheets_main = document.getElementById("sheets_main");
const message_main = document.getElementById("message_main");
const sheetsBtn = document.getElementById("sheetsBtn");
const cleanBtn = document.getElementById("cleanBtn");
const backToAlbum = document.getElementById("backToAlbum");
const exportBtn = document.getElementById("exportBtn");

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

document.addEventListener('DOMContentLoaded', function (){
    popupLoaded();
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTabUrl = tabs[0].url;
    
        if (currentTabUrl.includes("spotify.com")) {
            popup_main.classList.remove('hide');
        } else {
            message_main.classList.remove('hide');
        }
    });
});

function capitalizeFirst(str) {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function addRemoveTrack(track){
    chrome.storage.local.get('trackList', function(data) {
        if (!data.trackList) {
            data.trackList = {};
        }
        let trackKeys = Object.keys(data.trackList)
        let divObj = document.getElementById(track.uid);

        if(trackKeys.includes(track.uid)){
            delete data.trackList[track.uid];
            divObj.classList.add('trackOff');
            divObj.classList.remove('trackOn');
        }
        else{
            divObj.classList.remove('trackOff');
            divObj.classList.add('trackOn');
            data.trackList[track.uid] = track.track;
        }

        chrome.storage.local.set({'trackList': data.trackList});
    });
}

function removeFromExportList(uid){
    if (confirm('Are you sure you want to remove this track from the Export List?')) {
        chrome.storage.local.get('trackList', function(data) {
            let divObj = document.getElementById(`SheetID_${uid}`);
            divObj.remove();
            delete data.trackList[uid];
            chrome.storage.local.set({'trackList': data.trackList});
        });
    }
}
function cleanExportList(uid){
    if (confirm('Are you sure you want to clear the Export List?')) {

        chrome.storage.local.get('trackList', function(data) {
            sheet_tracks.innerHTML = "";
            chrome.storage.local.set({'trackList': {}});
        });
    }
}

function popupLoaded() {
    chrome.storage.local.get(['albumData'], function(albumData) {
        albumData = albumData.albumData;
        // console.log(albumData);
        
        let trackKeys = [];
        let albumType = capitalizeFirst(albumData.type);
        albumTypeObj.innerHTML = albumType;
        albumNameObj.innerHTML = albumData.name;
        bodyObj.style.background = `linear-gradient(${albumData.coverArt.extractedColors.colorLight.hex}, #2a2a2a)`;
        const tracksObj = albumData.tracks.items
        chrome.storage.local.get('trackList', function(data) {
            if (!data.trackList) {
                data.trackList = {};
            }
            trackKeys = Object.keys(data.trackList)
            
            for (let i = 0; i < tracksObj.length; i++) {
                const newDiv = document.createElement("div");
                newDiv.id = tracksObj[i].uid;
                newDiv.classList.add('d-flex','justify-content-between','p-1','m-1');
                if(trackKeys.includes(tracksObj[i].uid)){
                    newDiv.classList.add('trackOn');
                }else{
                    newDiv.classList.add('trackOff');
                }
                newDiv.innerHTML = `
                <div>${tracksObj[i].track.name}</div>
                <div>${numberCommas(tracksObj[i].track.playcount)}</div>
                `
                newDiv.addEventListener('click', function() {
                    addRemoveTrack(tracksObj[i]);
                });
                trackViewObj.appendChild(newDiv);
            }

        });
    });
}

sheetsBtn.addEventListener('click', function(){
    popup_main.classList.toggle('hide');
    sheets_main.classList.toggle('hide');

    chrome.storage.local.get('trackList', function(data) {
        if (!data.trackList) {
            data.trackList = {};
        }
        let trackList = data.trackList
        
        let keysList = Object.keys(trackList)
        sheetTrackViewObj.innerHTML = "";
        for (let i = 0; i < keysList.length; i++) {
            const newDiv = document.createElement("div");
            newDiv.id = `SheetID_${keysList[i]}`;
            newDiv.classList.add('d-flex','justify-content-between','trackSheet','p-1','m-1');
            newDiv.innerHTML = `
            <div>${trackList[keysList[i]].name}</div>
            <div>${numberCommas(trackList[keysList[i]].playcount)}</div>
            `
            newDiv.addEventListener('click', function() {
                removeFromExportList(keysList[i]);
            });
            sheetTrackViewObj.appendChild(newDiv);
        }
    
    });
});

cleanBtn.addEventListener('click', function(){
    cleanExportList();
});

backToAlbum.addEventListener('click', function(){
    popup_main.classList.toggle('hide');
    sheets_main.classList.toggle('hide');
    trackViewObj.innerHTML = "";
    popupLoaded();
});

exportBtn.addEventListener('click', function(){
    downloadAsExcel();
});

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
            "Streams":obj.playcount,
        }
        serialised.push(final_obj);
    }
    return serialised;
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
        saveAsExcel(excelBuffer, `SpotifyStreamLog_${timestamp}`);
    });
}

function saveAsExcel(buffer, filename){
    const data = new Blob([buffer], {type: EXCEL_TYPE});
    saveAs(data, filename+EXCEL_EXTENSION);
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

function numberCommas(number) {
    let strNumber = number.toString();
    strNumber = strNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return strNumber;
}
