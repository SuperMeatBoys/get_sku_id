// ==UserScript==
// @name         GetSKUID
// @namespace    https://github.com/gesuper/get_sku_id/blob/main/get_sku_id.js
// @version      0.1
// @description  try to take over the world!
// @author       supermeatboy
// @match        https://shopee.co.id/*
// @match        https://shopee.co.th/*
// @match        https://shopee.com.my/*
// @match        https://shopee.sg/*
// @match        https://shopee.ph/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shopee.co.id
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let oldfetch = fetch;
    let skuNameToID = {}
    let maxRetry = 20
    let retryCount = 1
    var selectSkuList = {}
    function fuckfetch() {
        return new Promise((resolve, reject) => {
            oldfetch.apply(this, arguments).then(response => {
                const oldJson = response.json;
                response.json = function() {
                    return new Promise((resolve, reject) => {
                        oldJson.apply(this, arguments).then(result => {
                            // 命中sku 请求，解析出skuNameToID
                            if(result.data && result.data.models) {
                                console.info("hook", result.data.models)
                                for(let item of result.data.models) {
                                    skuNameToID[item.name]=item.modelid
                                }
                                // 延迟触发显示id
                                setTimeout(updateSkuId, 1000)
                            }
                            resolve(result);
                        });
                    });
                };
                resolve(response);
            });
        });
    }
    window.fetch = fuckfetch;

    // Your code here...
    function updateSkuId() {
        if(retryCount > maxRetry) {
            return
        }
        let doms = document.querySelectorAll(".product-variation")
        // 伺机重试
        if(!doms || doms.length == 0) {
            setTimeout(updateSkuId, 1000)
            return
        }
        let lastSku = doms[doms.length - 1]
        let newDiv = document.createElement("div");
        newDiv.style.width = "100%"
        let newPre = document.createElement("pre");
        newPre.id = "supermeatboy_sku_map"
        var jsonText = JSON.stringify(skuNameToID, Object.keys(skuNameToID).sort(), " ")
        newPre.innerText = jsonText.substring(1, jsonText.length -2);
        newDiv.appendChild(newPre);
        lastSku.parentNode.appendChild(newDiv);
        let skuLevelCount = 0
        let skuParentNode = null;
        for(let d of doms) {
            if(skuParentNode == null || d.parentNode != skuParentNode) {
                skuParentNode = d.parentNode
                skuLevelCount += 1
            }
            d.setAttribute("sku_level", skuLevelCount)
            d.addEventListener("click", (e) => {
                let skuDom = e.target
                var skuName = skuDom.innerText
                var skuLevel = skuDom.getAttribute("sku_level")
                if(selectSkuList[skuLevel] == skuName) {
                    selectSkuList[skuLevel] = null
                } else {
                    selectSkuList[skuLevel] = skuName
                }
                // console.info("click", skuDom.innerText, selectSkuList)

                var skuMapNode = document.getElementById("supermeatboy_sku_map")
                var filterSkuMap = {}
                for(let key in skuNameToID) {
                    let skuNames = key.split(",")
                    let isAllSkuExist = true
                    for(let skuLevel in selectSkuList) {
                        if(!selectSkuList[skuLevel]) {
                            continue
                        }
                        if(skuNames.indexOf(selectSkuList[skuLevel]) < 0) {
                            isAllSkuExist = false
                        }
                    }
                    if(isAllSkuExist) {
                        filterSkuMap[key] = skuNameToID[key]
                    }
                }

                var jsonText = JSON.stringify(filterSkuMap, Object.keys(filterSkuMap).sort(), " ")
                // 去掉首尾的 花括号
                skuMapNode.innerText = jsonText.substring(1, jsonText.length -2);
            });
        }
    }
    //
})();
