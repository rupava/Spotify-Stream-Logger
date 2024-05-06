const base_constants = 
{
  "=getAlbum&variables=":
  {
    "unionType": "albumUnion",
  },
  "=getTrack&variables=":
  {
    "unionType": "trackUnion",
  },
  "=fetchPlaylist&variables=":
  {
    "unionType": "playlistV2",
  }
}

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

chrome.webRequest.onBeforeSendHeaders.addListener(
  async function(e) {
    let urlCheck = e.url

    if(Object.keys(base_constants).some(key => urlCheck.includes(key))){
      const authObj = e.requestHeaders.find(o => o.name === "authorization");
      if (authObj && authObj.value) {
        if(urlCheck.includes("=fetchPlaylist&variables=")){
          let store = {"playlist_url":urlCheck,"auth":authObj.value}
          chrome.storage.local.set({"playlist_bundle":store});
          return true;
        }
        const data = await getData(urlCheck,authObj.value);
        const paramsObj = Object.keys(base_constants).find(key => urlCheck.includes(key))
        if(data != false){
          let dump_data = data.data[base_constants[paramsObj].unionType]
          chrome.storage.local.set({"dump_data":dump_data});
        }
      }
    }
  },
  {
    urls: ["<all_urls>"],
    types: ["xmlhttprequest"]
  },
  ["extraHeaders","requestHeaders"]
);