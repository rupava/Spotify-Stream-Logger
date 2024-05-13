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
            "ID":obj.track.uri,
            "Track Name":obj.track.name,
            "Artists": obj.track.artists.items.map(item => item.profile.name).join(", "),
            "Streams":obj.track.playcount,
        }
        serialised.push(final_obj);
    }
    return serialised;
}

function saveAsExcel(buffer, filename){
    const data = new Blob([buffer], {type: EXCEL_TYPE});
    saveAs(data, filename+EXCEL_EXTENSION);
}

function exportAlbum(trackObj){
    const final_data = dataSerializer(trackObj);
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
    saveAsExcel(excelBuffer, `Spotify_Album_StreamLog_${timestamp}`);
}

function album_track_load() {
    let tracksObj = []

    chrome.storage.local.get(['dump_data'], function(dump_data) {
        dump = dump_data.dump_data;
        
        let trackKeys = [];
        document.getElementById('collectionType').innerHTML = capFirst(filterByPath(dump,base_constants[PAGE_TYPE].collectionName));
        document.getElementById('collectionName').innerHTML = dump.name;

        document.getElementById("body").style.background = `linear-gradient(${filterByPath(dump,base_constants[PAGE_TYPE].colorPath)}, #2a2a2a)`;
        if(PAGE_TYPE == "album"){
            tracksObj  = dump.tracks.items
            document.getElementById("exportStick").classList.toggle("hide");
            document.getElementById("exportAlbumBtn").classList.toggle("hide");
        }else if(PAGE_TYPE = "track"){
            tracksObj = [{
                "track": {
                    "name" : dump.name,
                    "playcount" : dump.playcount,
                    "uri": dump.uri,
                    "artists": dump.firstArtist
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
                    if(tracksObj[i].track.relinkingInformation == null){
                        uriDat = tracksObj[i].track.uri;
                    }else{
                    uriDat = tracksObj[i].track.relinkingInformation.linkedTrack.uri}
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
    let exportAlbumBtn = document.getElementById("exportAlbumBtn");

    exportAlbumBtn.addEventListener('click', function(){
        exportAlbum(tracksObj);
    });
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
