var lzmMessageListener = function(e)
{
    if (lz_poll_server.toLowerCase().indexOf(e.origin.toLowerCase()) == 0) {
        var linkNodes, i;
        switch (e.data) {
            case 'block_page':
                linkNodes = document.getElementsByTagName('a');
                for (i=0; i<linkNodes.length; i++) {
                    linkNodes[i].onclick = function(e) {
                        e.preventDefault();
                    }
                }
                parent.postMessage({cobrowse: true, blocked: true}, lz_poll_server);
                break;
            case 'unblock_page':
                var bds = document.getElementsByClassName('lzm-blocking-div');
                while(bds[0]) {
                    bds[0].parentNode.removeChild(bds[0])
                }
                linkNodes = document.getElementsByTagName('a');
                for (i=0; i<linkNodes.length; i++) {
                    linkNodes[i].onclick = function(e) {
                        e.preventDefault();
                        var targetUrl = '', hasTagetBlank = false;
                        if (typeof e.target.href == 'undefined') {
                            var parentNode = e.target.parentNode, lc = 0;
                            while (parentNode.name.toLowerCase() != 'html' && lc < 100) {
                                if (typeof parentNode.href != 'undefined') {
                                    targetUrl = parentNode.href;
                                    for (var i=0; i<parentNode.attributes.length; i++) {
                                        if (parentNode.attributes[i].name.toLowerCase() == 'target' && parentNode.attributes[i].value.toLowerCase() == '_blank') {
                                            hasTagetBlank = true;
                                        }
                                    }
                                    break;
                                }
                                parentNode = parentNode.parentNode;
                                lc++;
                            }
                        } else {
                            targetUrl = e.target.href;
                            for (var j=0; j<e.target.attributes.length; j++) {
                                if (e.target.attributes[j].name.toLowerCase() == 'target' && e.target.attributes[j].value.toLowerCase() == '_blank') {
                                    hasTagetBlank = true;
                                }
                            }
                        }
                        if (targetUrl.indexOf('javascript') != 0) {
                            var msgObject = {cobrowse: true, blocked: false, link_url: targetUrl, has_target_blank: false};
                            if (hasTagetBlank) {
                                msgObject['has_target_blank'] = true;
                            }
                            parent.postMessage(msgObject, lz_poll_server);
                        }
                    }
                }
                parent.postMessage({cobrowse: true, blocked: false}, lz_poll_server);
                break;
            default:
                parent.postMessage({cobrowse: true, unknown: e.data}, lz_poll_server);
                break;
        }
    }
};

if (window.addEventListener) {
    addEventListener("message", lzmMessageListener, false)
} else {
    attachEvent("onmessage", lzmMessageListener)
}