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

// chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//     let activeTab = tabs[0];


// });

chrome.webRequest.onBeforeSendHeaders.addListener(
    async function(e) {
        let urlCheck = e.url
        let reqHeadObj = e.requestHeaders
        checkBase = "https://api-partner.spotify.com/pathfinder/v1/query?operationName=getAlbum&variables="
        if(urlCheck.startsWith(checkBase)){
            const authObj = reqHeadObj.find(o => o.name === "authorization");
            if (authObj && authObj.value) {
                const bearerToken = authObj.value;
                let data = await getData(urlCheck,bearerToken);
                if(data != false){
                    const albumData = data.data.albumUnion
                    chrome.storage.local.set({ "albumData": albumData});
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