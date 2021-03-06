const msgList = [];
let queueAvlStatus = true;
function sendConfirmationMsg(order, template) {
    let msgBody = template.replace('*****ORDER_NO******', order.orderId);
    msgBody = msgBody.replace('****BODY*****', order.shippingAddress);
    for (let i = 0; i < order.phoneNumbers.length; i++) {
        WAPI.sendMessage2('91' + order.phoneNumbers[i] + '@c.us', msgBody);
    }
}
function sendNextMsg() {
    if (msgList.length) {
        sendData(msgList.shift());
    }else{
        queueAvlStatus = true;
    }
}
function sendData(msg) {
    const webhookUrl = intents.appconfig.webhook.prod;
    fetch(webhookUrl, {
        method: "POST",
        body: JSON.stringify(msg.body),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((resp) => resp.json()).then(function (response) {
        if (response && response.orderId) {
            WAPI.sendMessage2(msg.chatId._serialized, 'Order has been created, orderId: ' + response.orderId + ' for :' + response.shippingAddress);
        } else {
            WAPI.sendMessage2(msg.chatId._serialized, 'It looks soemthing went wrong While crating order, Apologies for inconvinience \n' + msg.body);
        }
        sendNextMsg();

    }).catch(function (error) {
        sendNextMsg();
        window.log(`Error===>${error.stack}`);
        WAPI.sendMessage2(msg.chatId._serialized, 'It looks soemthing went wrong, Apologies for inconvinience \n' + msg.body.shippingAddress);
    });
}
function pushMsg(msg) {
    if (msgList.length === 0 && queueAvlStatus) {
        queueAvlStatus = false
        sendData(msg);
    } else {
        msgList.push(msg);
    }
}
// data = WAPI.getAllChatsWithNewMsg();
// window.log(`all unread data..${JSON.stringify(data)}`);
WAPI.waitNewMessages(false, async (data) => {
    for (let i = 0; i < data.length; i++) {
        let message = data[i];
        body = {};
        body.shippingAddress = message.body;
        body.msgIds = [message.id];
        window.log(`Chat id===>${message.chatId}`);
        const userDetails = intents.users[message.chatId._serialized];
        body.user = userDetails ? userDetails.name : '';
        try {
            body.userPhone = (message.chatId + "").substr(2, 10);
            body.orderStatus = 'confirmed'
            body.orderDate = new Date();
        } catch (e) {
            window.log(`error==>${e.stack}`);
        }

        if (body.userPhone) {
            pushMsg({ body, chatId: message.chatId });
        }


    }
});
WAPI.addOptions = function () {
    var suggestions = "";
    intents.smartreply.suggestions.map((item) => {
        suggestions += `<button style="background-color: #eeeeee;
                                margin: 5px;
                                padding: 5px 10px;
                                font-size: inherit;
                                border-radius: 50px;" class="reply-options">${item}</button>`;
    });
    var div = document.createElement("DIV");
    div.style.height = "40px";
    div.style.textAlign = "center";
    div.style.zIndex = "5";
    div.innerHTML = suggestions;
    div.classList.add("grGJn");
    var mainDiv = document.querySelector("#main");
    var footer = document.querySelector("footer");
    footer.insertBefore(div, footer.firstChild);
    var suggestions = document.body.querySelectorAll(".reply-options");
    for (let i = 0; i < suggestions.length; i++) {
        const suggestion = suggestions[i];
        suggestion.addEventListener("click", (event) => {
            console.log('lin 101 ==>', event.target.textContent);
            window.sendMessage(event.target.textContent).then(text => console.log(text));
        });
    }
    mainDiv.children[mainDiv.children.length - 5].querySelector("div > div div[tabindex]").scrollTop += 100;
}
