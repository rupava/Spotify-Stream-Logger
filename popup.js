const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

var PAGE_TYPE = "";

const base_constants = 
  {
    "album":
    {
        "collectionName":"type",
        "colorPath" : "coverArt.extractedColors.colorRaw.hex",
    },
    "track":
    {
        "collectionName":"__typename",
        "colorPath" : "albumOfTrack.coverArt.extractedColors.colorRaw.hex",
    },
    "playlist":{
        "collectionName": "__typename",
    }
  }

document.addEventListener('DOMContentLoaded', function (){
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTabUrl = tabs[0].url;
    
        if (currentTabUrl.includes("spotify.com")) {
            let keyFetch = Object.keys(base_constants).find(key => currentTabUrl.includes(key))
            if(keyFetch){
                if(keyFetch=="playlist"){
                    loadHtml("./playlist/playlist_main.html","body",function (){
                        loadJS("./playlist/playlist.js")
                        PAGE_TYPE = keyFetch;
                    });
                }else{
                    loadHtml("./album_track/album_track_main.html","body",function (){
                        loadJS("./album_track/album_track.js")
                        PAGE_TYPE = keyFetch;
                    });
                }
            }
            else{
                loadHtml("message_main.html","body",function (){
                    const message_space = document.getElementById("message_space");
                    message_space.innerHTML = "Open a Track/Album/Playlist";
                });
            }
        } else {
            loadHtml("message_main.html","body",function (){
                const message_space = document.getElementById("message_space");
                message_space.innerHTML = "This site is not";

            });
        }
    });
});

function changePages(page_name){
    document.getElementById("body").innerHTML = "";
    loadHtml(`./${page_name}/${page_name}_main.html`,"body",function (){
        loadJS(`./${page_name}/${page_name}.js`)
    });
}

function numberCommas(number) {
    let strNumber = number.toString();
    strNumber = strNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return strNumber;
}

function capFirst(str) {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterByPath(obj, path) {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
        if (value.hasOwnProperty(key)) {
            value = value[key];
        } else {
            return null;
        }
    }
    return value;
}

function loadHtml(filename, targetId, callback) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                document.getElementById(targetId).innerHTML = xhr.responseText;
                if (typeof callback === 'function') {
                    callback();
                }
            } else {
                console.error('Error loading HTML file:', xhr.statusText);
            }
        }
    };
    xhr.open('GET', filename, true);
    xhr.send();
}

function loadJS(filename) {
    const script = document.createElement('script');
    script.src = filename;
    document.body.appendChild(script);
}