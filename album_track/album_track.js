function album_track_load() {
    chrome.storage.local.get(['dump_data'], function(dump_data) {
        dump = dump_data.dump_data;
        console.log(dump);
        
        let trackKeys = [];
        document.getElementById('collectionType').innerHTML = capFirst(filterByPath(dump,base_constants[PAGE_TYPE].collectionName));
        document.getElementById('collectionName').innerHTML = dump.name;

        document.getElementById("body").style.background = `linear-gradient(${filterByPath(dump,base_constants[PAGE_TYPE].colorPath)}, #2a2a2a)`;
        let tracksObj = []
        if(PAGE_TYPE == "album"){
            tracksObj  = dump.tracks.items
        }else if(PAGE_TYPE = "track"){
            tracksObj = [{
                "track": {
                    "name" : dump.name,
                    "playcount" : dump.playcount,
                    "uri": dump.uri
                }
            }]
        }
        
        chrome.storage.local.get('trackList', function(data) {
            if (!data.trackList) {
                data.trackList = {};
            }
            trackKeys = Object.keys(data.trackList)
            
            for (let i = 0; i < tracksObj.length; i++) {
                const newDiv = document.createElement("div");
                let uriDat = ""
                if(tracksObj.length > 1){
                    uriDat = tracksObj[i].track.relinkingInformation.linkedTrack.uri
                }
                else{
                    uriDat = tracksObj[i].track.uri;
                }
                newDiv.id = uriDat;
                newDiv.classList.add('d-flex','justify-content-between','p-1','m-1');
                if(trackKeys.includes(uriDat)){
                    newDiv.classList.add('trackOn');
                }else{
                    newDiv.classList.add('trackOff');
                }
                newDiv.innerHTML = `
                <div>${tracksObj[i].track.name}</div>
                <div>${numberCommas(tracksObj[i].track.playcount)}</div>
                `
                newDiv.addEventListener('click', function() {
                    addRemoveTrack(tracksObj[i],uriDat);
                });
                document.getElementById("tracks").appendChild(newDiv);
            }

        });
    });
    
    let sheetsBtn = document.getElementById("sheetsBtn");

    sheetsBtn.addEventListener('click', function(){
        changePages('export_list');
    });
}

function addRemoveTrack(track,uriDat){
    chrome.storage.local.get('trackList', function(data) {
        if (!data.trackList) {
            data.trackList = {};
        }
        let trackKeys = Object.keys(data.trackList)

        let divObj = document.getElementById(uriDat);

        if(trackKeys.includes(uriDat)){
            delete data.trackList[uriDat];
            divObj.classList.add('trackOff');
            divObj.classList.remove('trackOn');
        }
        else{
            divObj.classList.remove('trackOff');
            divObj.classList.add('trackOn');
            data.trackList[uriDat] = track.track;
        }

        chrome.storage.local.set({'trackList': data.trackList});
    });
}

album_track_load();
