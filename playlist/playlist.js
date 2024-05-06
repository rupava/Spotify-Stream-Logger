async function getData(url, token) {  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      return data
    } catch (error) {
        console.error('Error fetching data:', error);
        return false;
    }
}

function fillTrackList(dump){
  const tracksObj = dump.content.items
  const trackViewObj = document.getElementById("tracks");
  trackViewObj.innerHTML="";
  for (let i = 0; i < tracksObj.length; i++) {
    const singleTrack = tracksObj[i];

    const newDiv = document.createElement("div");
    newDiv.id = singleTrack.itemV2.data.uri;
    newDiv.classList.add('d-flex','justify-content-between','trackOff','p-1','m-1');
    newDiv.innerHTML = `
                <div>${singleTrack.itemV2.data.name}</div>
                <div>${numberCommas(singleTrack.itemV2.data.playcount)}</div>
                `;
    trackViewObj.appendChild(newDiv);
  }
}

function parseParams(url) {
  const params = {};
  const queryString = url.split('?')[1];
  if (queryString) {
      const pairs = queryString.split('&');
      pairs.forEach(pair => {
          const keyValue = pair.split('=');
          const key = decodeURIComponent(keyValue[0]);
          let value = decodeURIComponent(keyValue[1] || '');
          if (key === 'variables' || key === 'extensions') {
              value = JSON.parse(value);
          }
          params[key] = value;
      });
  }
  return params;
}

function objectToQueryString(obj) {
  return Object.keys(obj)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
      .join('&');
}

function clearEventListeners(element) {
  const clone = element.cloneNode(true);
  element.parentNode.replaceChild(clone, element);
}

async function pagers(playlist_url,auth, prevCount, nextCount,totalCount,pnPage){
  if(nextCount==0 && pnPage){
    return true;
  }else if(prevCount==0 && !pnPage){
    return true;
  }

  const base = "https://api-partner.spotify.com/pathfinder/v1/query";
  document.getElementById("loader").classList.toggle("hide");
  document.getElementById("tracks").classList.toggle("hide");

  prevCount = parseInt(prevCount);
  nextCount = parseInt(nextCount);

  if(pnPage){
    prevCount+=25;
    if(nextCount < 25){
      nextCount = 0;
    }else{
      nextCount-=25;
    }
  }else{
    nextCount = totalCount-prevCount
    prevCount-=25;
  }

  const parsedParams = parseParams(playlist_url);
  let { operationName, variables, extensions } = parsedParams;

  variables["offset"] = prevCount;

  const nextUrl = base + '?' +
    objectToQueryString({ operationName, variables: JSON.stringify(variables), extensions: JSON.stringify(extensions) });

  const data = await getData(nextUrl,auth);
  const dump = data.data.playlistV2;

  fillTrackList(dump);
  
  document.getElementById("prevCount").innerHTML = prevCount;
  document.getElementById("nextCount").innerHTML = nextCount;
  
  document.getElementById("loader").classList.toggle("hide");
  document.getElementById("tracks").classList.toggle("hide");

  let nextBtn = document.getElementById("nextBtn");
  let prevBtn = document.getElementById("prevBtn");
  clearEventListeners(nextBtn);
  clearEventListeners(prevBtn);
  let nextBtnNew = document.getElementById("nextBtn");
  let prevBtnNew = document.getElementById("prevBtn");

  prevBtnNew.addEventListener('click', function(){
    pagers(nextUrl,auth,prevCount,nextCount,dump.content.totalCount,false);
  });

  nextBtnNew.addEventListener('click', function(){
    pagers(nextUrl,auth,prevCount,nextCount,dump.content.totalCount,true);
  });

}

function playlistLoad(){
  chrome.storage.local.get(['playlist_bundle',], async function(playlist_bundle) {
    let playlist_url = playlist_bundle.playlist_bundle.playlist_url;
    let auth = playlist_bundle.playlist_bundle.auth;

    const data = await getData(playlist_url,auth);
    document.getElementById("main").classList.toggle("hide");
    document.getElementById("loader").classList.toggle("hide");

    const dump = data.data.playlistV2;

    document.getElementById("collectionType").innerHTML = dump.__typename
    document.getElementById("collectionName").innerHTML = dump.name

    document.getElementById("prevCount").innerHTML = "0";
    nextCount = parseInt(dump.content.totalCount)-25;
    if(nextCount<0){
      nextCount = 0;
    }
    document.getElementById("nextCount").innerHTML = nextCount;
    
    document.getElementById("body").style.background = `linear-gradient(${dump.images.items[0].extractedColors.colorRaw.hex}, #2a2a2a)`;

    let nextBtn = document.getElementById("nextBtn");
    let prevBtn = document.getElementById("prevBtn");

    nextBtn.addEventListener('click', function(){
      pagers(playlist_url,auth,0,nextCount,dump.content.totalCount,true);
    });

    fillTrackList(dump);
  });
}

playlistLoad();