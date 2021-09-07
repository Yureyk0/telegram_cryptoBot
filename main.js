const TelegramApi = require('node-telegram-bot-api')

const request = require('request')

const token = '1814664856:AAHSRegO0gOAcVY7CrOeDLUi4cGE1rKLpL4'

const bot = new TelegramApi(token, {polling: true})

const db = require('./db/db')

const Users = db.users
const Wallets = db.wallets
const Tokens = db.tokens
const Times = db.times
const Targetmesses = db.targetmesses

const KB = {
    news: 'Новини',
    currency: 'Курс',
    portfolio: 'Портфель',
    signal: 'Тех. аналіз',
    topList: 'Популярне',
    seachToken: 'Пошук',
    back: 'Назад',
    createProtfolio: 'Створити портфель',
    editPortfolio: 'Редагування портфеля',
    deletePortfolio: 'Видалити портфель'
}

const endUrlLink = {
    topListUrl: '/top/totalvolfull?limit=10&tsym=USD',
    searchToken: '/pricemultifull?fsyms=',
    news: '/v2/news/?lang=EN',
    signal: '/tradingsignals/intotheblock/latest?fsym='
}

const topCrypto = ['BTC','ETH','DOGE','LTC','ADA']

const option = {
    "parse_mode": "HTML"
}

bot.onText(/\/admin/, async (msg) =>{
    if (msg.chat.id == 414228816){
        bot.sendMessage(msg.chat.id,'Введіть текс для відправки всім користувачам .')
        let text = await onText()
        bot.sendMessage(msg.chat.id,'Введіть час відправки всім користувачам .')
        let time = await onText()
        Targetmesses.create({
            mess: text,
            time: time
        }).then(result => {
            console.log(result)
        }).catch(err =>{
            console.log(err)
        })

    }else {
        bot.sendMessage(msg.chat.id,'Ви не адмін')
    }
})

bot.onText(/\/start/, async (msg) =>{
    let data = await Users.findOne({where:{ user_id: msg.chat.id}})
    // let data1 = await Users.findAll({where:{ user_name: 'Yurets228'}})
    console.log(msg.from.username)
    if(data == null){
        if ( msg.from.username == undefined ){
            Users.create({
                user_id: msg.from.id,
                user_name: msg.from.first_name
            }).then(result => {
                console.log(result)
            }).catch(err =>{
                console.log(err)
            })
        }else {
            Users.create({
                user_id: msg.from.id,
                user_name: msg.from.username
            }).then(result => {
                console.log(result)
            }).catch(err =>{
                console.log(err)
            })

        }
    }

    bot.sendMessage(msg.chat.id, 'Раді вас бачити .', {
        reply_markup:{
            keyboard:[
                [KB.news, KB.currency],
                [KB.portfolio, KB.signal]
            ]
        }
    })
})

bot.on('message',msg=>{
    // console.log(msg)
    switch (msg.text){
        case KB.news:
            blockNews(msg.chat.id, true)
            break
        case KB.currency:
            blockCurrency(msg.chat.id)
            break
        case KB.signal:
            blockSignal(msg.chat.id)
            break
        case KB.topList:
            sendTopListCurrency(msg.chat.id)
            break
        case KB.seachToken:
            searchTokenPrice(msg.chat.id)
            break
        case KB.back:
            start(msg.chat.id)
            break
        case KB.portfolio:
            blockPortfolio(msg)
            break
        case KB.createProtfolio:
            createProtfolio(msg)
            break
        case KB.editPortfolio:
            editPortfolio(msg.chat.id)
            break

    }
    console.log(msg.chat.username)



}) // Свитч для главных ф-й

function start(chatId){
    bot.sendMessage(chatId, "Ви в головному меню )", {
        reply_markup:{
            keyboard:[
                [KB.news, KB.currency],
                [KB.portfolio, KB.signal]
            ]
        }
    })

}

function blockCurrency(chatId){
    bot.sendMessage(chatId, `Оберіть потрібну вам кнопку) :`,{
        reply_markup:{
            keyboard:[
                [KB.topList, KB.seachToken],
                [KB.back]
            ]
        }
    })
    bot.on('message',msg=>{
        if(msg.text === KB.back){
            // start(msg.chat.id)
        }
    })

}// меню курса

async function sendTopListCurrency(chatId){

    const list = await anyParseAPI(endUrlLink.topListUrl);
    // console.log(list)
    let tmp=''
    let tmpRovno
    let tmpProcent

    for(let i = 0; i < list.Data.length; i++){
        tmpProcent = ((list.Data[i].RAW.USD.PRICE - list.Data[i].RAW.USD.OPEN24HOUR)/(list.Data[i].RAW.USD.OPEN24HOUR/100)).toFixed(2)

        tmpRovno = `${list.Data[i].CoinInfo.FullName.italics()} (${list.Data[i].CoinInfo.Name.bold()})`
        if(tmpRovno.length >=15){
            tmpRovno = `${list.Data[i].CoinInfo.Name.italics()} (${list.Data[i].CoinInfo.Name.bold()})`
        }
        if(tmpRovno.length >5){
            for (tmpRovno.length; tmpRovno.length<=27;tmpRovno.length++){
                tmpRovno = tmpRovno + `~`;
            }
        }
        if (tmpProcent <=0){
            tmp= tmp + `\n🔴${tmpRovno} ${list.Data[i].RAW.USD.PRICE.toFixed(1).bold()}$ (⬇${tmpProcent}%)\n`
        }else {
            tmp= tmp + `\n🟢${tmpRovno} ${list.Data[i].RAW.USD.PRICE.toFixed(1).bold()}$ (⬆${tmpProcent}%)\n`
        }
        // tmp= tmp + `\n${tmpRovno} ${list.Data[i].RAW.USD.PRICE} (${tmpProcent}%) 🔴🟢⬆️⬇️`
    }

    console.log(tmpRovno.length)
    bot.sendMessage(chatId, `📈Ціна популярних курсів токенів :  \n${tmp}\n Натисніть на пошук якщо тут немає потрібного токена .... `,option)

}// вывод и адап курсов

async function searchTokenPrice(chatId){

    const endNameToken = '&tsyms=USD'
    let fullLink
    let resultSearch
    bot.sendMessage(chatId, `Введіть абревіатуру шукаємої криптовалюти(Наприклад: btc):`,{
        reply_markup:{
            keyboard:[
                [KB.back]
            ]
        }
    })
    const text = await onText() //btc
    fullLink = endUrlLink.searchToken+text+endNameToken
    const list = await anyParseAPI(fullLink)
    if(Object.keys(list).length == 2){
        if(list.RAW[text.toUpperCase()].USD.CHANGEPCT24HOUR >=0){
            resultSearch = `🟢(${list.RAW[text.toUpperCase()].USD.FROMSYMBOL.bold()})---${list.RAW[text.toUpperCase()].USD.PRICE.toFixed(1).bold()}$⬆\n1h  ${list.RAW[text.toUpperCase()].USD.CHANGEPCTHOUR.toFixed(2)}%    24H  ${list.RAW[text.toUpperCase()].USD.CHANGEPCT24HOUR.toFixed(2)}%`
        }else {
            resultSearch = `🔴(${list.RAW[text.toUpperCase()].USD.FROMSYMBOL.bold()})---${list.RAW[text.toUpperCase()].USD.PRICE.toFixed(1).bold()}$⬇\n1h  ${list.RAW[text.toUpperCase()].USD.CHANGEPCTHOUR.toFixed(2)}%    24H  ${list.RAW[text.toUpperCase()].USD.CHANGEPCT24HOUR.toFixed(2)}%`
        }

        bot.sendMessage(chatId, resultSearch, option)
        blockCurrency(chatId)
    }else{
        bot.sendMessage(chatId, `Упс, на жаль ми не змогли знайти таку криптовалюта . \n Спробуйте ще раз !)`)
        searchTokenPrice(chatId)

    }
}// поиск токена

async function anyParseAPI(endUrl){

    return new Promise(function(resolve, reject){
        request(`https://min-api.cryptocompare.com/data${endUrl}`, (error, response, body) =>{

            if(body == undefined){
                console.log(1)
            }else {
                const data = JSON.parse(body)
                resolve(data)
            }
        })
    })

}// уневерс парс для апи

async function onText(){
    return new Promise(function (resolve, reject){
        bot.on('message', msg=>{
            resolve(msg.text)
        })
    })
} // слушатель в виде ф-и

async function blockPortfolio(chatObj){
    let data = await Wallets.findAll({where:{user_id: chatObj.from.id}})
    if (Object.keys(data).length == 1){
        bot.sendMessage(chatObj.chat.id, "У вас вже є один портефель тому пропонуємо скористатися ним , або створити ще один .", {

            reply_markup:{
                keyboard:[
                    [`${data[0].dataValues.name_wallet}`,KB.createProtfolio],
                    [KB.editPortfolio],
                    [KB.back]
                ]
            }
        })
    }else if (Object.keys(data).length == 2){
        bot.sendMessage(chatObj.chat.id, "У вас вже є два портефеля , тому пропонуємо скористатися ними .", {

            reply_markup:{
                keyboard:[
                    [`${data[0].dataValues.name_wallet}`,`${data[1].dataValues.name_wallet}`],
                    [KB.editPortfolio],
                    [KB.back]
                ]
            }
        })
    }else{
        bot.sendMessage(chatObj.chat.id, "У вас ще немає власного портфеля на нашому сервісі , тому рекомендуємо його створити зараз !!!", {
            reply_markup:{
                keyboard:[
                    [KB.createProtfolio],
                    [KB.back]
                ]
            }
        })
    }
    let text = await onText()


    if(data[0] == undefined){

    }else if (text == data[0].dataValues.name_wallet){
        editInsideWallet(chatObj.chat.id, data[0].dataValues.id_wallet,text)
    }else if(data[1] != undefined && data[1].dataValues.name_wallet == text){
        editInsideWallet(chatObj.chat.id, data[1].dataValues.id_wallet,text)
    }else if(KB.editPortfolio == text){

    }else if(text == KB.back){

    }else if (KB.createProtfolio == text){

    }else {
        start(chatObj.chat.id)
    }
}// адап меню портф

async function createProtfolio(chatObj){
    bot.sendMessage(chatObj.chat.id, `Введіть назву свого портфелю ( Наприклад : "Портфель №1" ). \n Назва має містити не більше 15 символів . `,{
        reply_markup:{
            keyboard:[
                [KB.back]
            ]
        }
    })
    let text = await onText()
    console.log(text)
    if (text.length >15){
       await createProtfolio(chatObj)
    }else if(text == KB.back){

    }else{
        Wallets.create({
            user_id: chatObj.from.id,
            name_wallet: text,
            balance: 0
        }).then(result => {
            console.log(result)
        }).catch(err =>{
            console.log(err)
        })
        bot.sendMessage(chatObj.chat.id, `Вітаємо вас , ви створили власний портфель , скоріш заповніть його !!! `)
        start(chatObj.chat.id)

    }

}

async function editPortfolio(chatid){
    bot.sendMessage(chatid, "Оберіть дію для редагування .", {
        reply_markup:{
            keyboard:[
                [KB.deletePortfolio],
                [KB.back]
            ]
        }
    })
    let text = await onText()
    if (text == KB.back){

    }else if (text == KB.deletePortfolio){
        let data = await Wallets.findAll({where:{user_id: chatid}})
        let tmpKeybord = []
        for (let i = 0; i<Object.keys(data).length; i++){
            tmpKeybord.push(data[i].dataValues.name_wallet)
        }

        bot.sendMessage(chatid, "Оберіть портфель , якмй ви хочете видалити  .", {
            reply_markup:{
                keyboard:[
                    tmpKeybord,
                    [KB.back]
                ]
            }
        })

        text = await onText()

        if (text == KB.back){

        }else if (text == tmpKeybord[0] || text == tmpKeybord[1]){
            data = await Wallets.findOne({where:{name_wallet: text}})
            deletePortfolio(chatid,data.dataValues.id_wallet)
        }else {
            bot.sendMessage(chatid, "Порушені правила вводу.")
            editPortfolio(chatid)
        }
    }

}

async function deletePortfolio(chatid,idWallets){

    await Tokens.destroy({ where : {id_wallet: idWallets}})
    await Times.destroy({where: {id_wallet : idWallets}})
    await Wallets.destroy({ where : {id_wallet : idWallets}})

    bot.sendMessage(chatid, "Ви видалили портфель .")
    start(chatid)
}

async function editInsideWallet(chatId,idWallets,nameWallet,complite){
    bot.sendMessage(chatId, `Ви переглядаєте портфель під назвою "${nameWallet}"`, {
        reply_markup:{
            keyboard:[
                [`Додати актив`,'Видалити актив'],
                [`Оновити портфель`],
                [`Додати/Видалити час сповіщення`],
                [KB.back]
            ]
        }
    })

    let data = await Tokens.findAll({where:{id_wallet: idWallets}})
    let tf = false
    if ((complite != true && Object.keys(data).length == 0) || (complite != true && data == null)){
        bot.sendMessage(chatId, `У вас ще немає створенuх активів , щоб додати активи натисніть на кнопку "Додати активи".`, {
            reply_markup:{
                keyboard:[
                    [`Додати актив`],
                    [KB.back]
                ]
            }
        })
    }else if (Object.keys(data).length >=1) {

        await outputActive(chatId,idWallets,nameWallet)


    }

    let text = await onText()
    if (text == 'Додати актив'){
        addToken(chatId,idWallets,nameWallet,data)
    }else if (text == KB.back){

    }else if(text == 'Видалити актив'){
        let tmp =''
        let arrTmp = [0]
        data = await Tokens.findAll({where:{id_wallet: idWallets}})

        if (Object.keys(data).length == 0 || data == null){
            bot.sendMessage(chatId, `У вас ще немає створенuх активів .`)
            start(chatId)
        }else if(Object.keys(data).length >= 1 ){
            for (let i=0; Object.keys(data).length>i;i++){
                tmp = tmp + `${i+1})  ${data[i].dataValues.name_token} ;\n`
                arrTmp.push(data[i].dataValues.id)
            }
            console.log(arrTmp)
            bot.sendMessage(chatId, `Ваші активи :\n\n ${tmp} \n\nДля видалення вашого активу потрібно написати індекс в чат (Наприклад : "1")`)
            text = await onText()

            if (Number(text)>=1 && Number(text)<arrTmp.length){
                await Tokens.destroy({ where : {id: arrTmp[Number(text)]}})
                await bot.sendMessage(chatId, `Ваш актив успішно видалено .`)
                start(chatId)
            }else {
                await bot.sendMessage(chatId, `Порушені правила вводу !`)
                start(chatId)
            }

        }
    }else if(text == `Оновити портфель`){
        editInsideWallet(chatId,idWallets,nameWallet,complite)
    }else if(text == `Додати/Видалити час сповіщення`){
        blockTimeMessage(chatId,idWallets,nameWallet)
    }else {
        start(chatId)
    }

}

async function addToken(chatId,idWallets,nameWallet,data){
    bot.sendMessage(chatId, `Введіть аббревіатуру криптовалюти , щоб додати її до ваших активів .`, {
        reply_markup:{
            keyboard:[
                [KB.back]
            ]
        }
    })

    let addToken = {
        id_wallet: idWallets,
        first_price	: 0,
        name_token: '',
        count_token: 0
    }

    let fullLink
    let text = await onText() //btc
    fullLink = endUrlLink.searchToken+text+'&tsyms=USD'
    const list = await anyParseAPI(fullLink)
    let complite = false

    if(Object.keys(list).length == 2){
        addToken.name_token = text.toUpperCase()
        console.log(addToken)

        bot.sendMessage(chatId, `Введіть кількість і ціну в долара$ криптовалюти у такому вигляді КІЛЬКІСТЬ/ЦІНА ( Наприклад : 0.0005/100 )`)
        let orig = 0
        for (let i = 0; i<Object.keys(data).length; i++){
            if (data[i].dataValues.name_token == text.toUpperCase()){
                orig++
            }
        }


        text = await onText()
        let arrCP = text.split('/')
        if (arrCP == null || arrCP.length <= 1 || text.indexOf('/')==-1 || arrCP.length >= 3 || Number(arrCP[0])==null || Number(arrCP[1])==null || orig >=1){
            bot.sendMessage(chatId, `Порушені норми вводу тексту , потрібно ввести у вигляді КІЛЬКІСТЬ/ЦІНА ( Наприклад : 0.0005/100 ) , або актив з такою назвою вже є в вашому потфелі .`)
            editInsideWallet(chatId,idWallets,nameWallet,complite,list)
        }else {
            addToken.count_token = arrCP[0]
            addToken.first_price = arrCP[1]
            Tokens.create(addToken).then(result => {
                console.log(result)
            }).catch(err =>{
                console.log(err)
            })
            complite = true
            bot.sendMessage(chatId, `Актив успішно додано , тепер можете слідкувати за ним у своєму портфелі . \n Ваш актив з’явиться найближчим часом (5-10 сек)`)
            let list = await Tokens.findAll({where:{id_wallet: idWallets}})
            editInsideWallet(chatId,idWallets,nameWallet,complite,list)
        }

    }else{

    }
}

async function blockTimeMessage(chatId,idWallets,nameWallet){

    let data = await Times.findAll({where:{user_id: chatId}})
    let tf = false

    if (Object.keys(data).length == 0 || data == null){
        bot.sendMessage(chatId, `Ви ще не обирали час надсилання поточного статусу вашого портфеля . Натисніть кнопку "Додати час" для того , щоб отримувати новини автоматично .`, {
            reply_markup:{
                keyboard:[
                    [`Додати час`],
                    [KB.back]
                ]
            }
        })
    }else {
        bot.sendMessage(chatId, `Ви ще не обирали час надсилання поточного статусу вашого портфеля . Натисніть кнопку "Додати час" для того , щоб отримувати новини автоматично .`, {
            reply_markup:{
                keyboard:[
                    [`Додати час`,`Видалити час`],
                    [KB.back]
                ]
            }
        })
    }

    let text = await onText()

    for (let a = 0; a<Object.keys(data).length; a++){
        if (data[a].dataValues.date_infoPortfolio == text){
            tf = true
        }
    }

    if (tf == true){
        bot.sendMessage(chatId, `Порушені норми вводу тексту , таке налаштування часу вже існує .`)
        blockTimeMessage(chatId,idWallets,nameWallet)
    }
    if (text == 'Додати час'){

        bot.sendMessage(chatId, `Введіть час в який хочите отримувати кожен день поточний статус вашого портфелю . Наприклад : ( 9:25 або 8:00)`)

        text = await onText()

        let arrCP = text.split(':')
        if (text == KB.back){

        }else if (arrCP == null || arrCP.length <= 1 || text.indexOf(':')==-1 || arrCP.length >= 3 || Number(arrCP[0])==null || Number(arrCP[1])==null || arrCP[0]>24 || arrCP[0] <0 || arrCP[1] >60 || arrCP[1]<0){
            bot.sendMessage(chatId, `Порушені норми вводу тексту , потрібно ввести у вигляді ГОДИНИ/ХВИЛИНИ (Наприклад :  9:25 або 8:00).`)
            blockTimeMessage(chatId,idWallets,nameWallet)
        }else {
            bot.sendMessage(chatId, `Вітаємо , час успішно додано .`)

            Times.create({
                user_id: chatId,
                id_wallet: idWallets,
                date_infoPortfolio: text
            }).then(result => {
                console.log(result)
            }).catch(err =>{
                console.log(err)
            })
        }


    }else if (text == 'Видалити час'){

        let tmp =''
        let arrTmp = [0]
        data = await Times.findAll({where:{user_id : chatId,id_wallet : idWallets}})
        console.log(data)
        if (text == KB.back){

        }else if (Object.keys(data).length == 0 || data == null){
            bot.sendMessage(chatId, `У вас ще не налаштована ця фукція  .`)
            blockTimeMessage(chatId,idWallets,nameWallet)
        }else if(Object.keys(data).length >= 1 ){
            for (let i=0; Object.keys(data).length>i;i++){
                tmp = tmp + `${i+1})  ${data[i].dataValues.date_infoPortfolio} ;\n`
                arrTmp.push(data[i].dataValues.id)
            }
            console.log(arrTmp)
            bot.sendMessage(chatId, `Ваші налаштування часу :\n${tmp}Для видалення певного часу потрібно написати індекс в чат (Наприклад : "1")`)
            text = await onText()

            if (text == KB.back){

            }else if (Number(text)>=1 && Number(text)<arrTmp.length){
                await Times.destroy({ where : {id: arrTmp[Number(text)]}})
                await bot.sendMessage(chatId, `Успішно видалено .`)
                editInsideWallet(chatId,idWallets,nameWallet)
            }else {
                await bot.sendMessage(chatId, `Порушені правила вводу !`)
                editInsideWallet(chatId,idWallets,nameWallet)
            }
        }

    }else if (text == KB.back){

    }

}

async function outputActive(chatId,idWallets,nameWallet){
    const endNameToken = '&tsyms=USD'
    let fullLink
    let resultSearch
    let tmp = ''
    let data = await Tokens.findAll({where:{id_wallet: idWallets}})

    for (let i=0; Object.keys(data).length>i;i++){
        tmp = tmp + `${data[i].dataValues.name_token},`
    }
    resultSearch = endUrlLink.searchToken + tmp.slice(0, -1) + endNameToken

    let listPort = await anyParseAPI(resultSearch)
    console.log(listPort)
    let textMess = ''
    let procent
    let totalBalance = 0
    for (let i=0; Object.keys(data).length>i;i++){
        procent = ((listPort.RAW[data[i].dataValues.name_token].USD.PRICE*data[i].dataValues.count_token - data[i].dataValues.first_price)/ (data[i].dataValues.first_price/100)).toFixed(2)
        totalBalance += Number((listPort.RAW[data[i].dataValues.name_token].USD.PRICE*data[i].dataValues.count_token))
        if (procent > 0){
            textMess = textMess + `${i+1}) 🟢 ${data[i].dataValues.name_token} (${data[i].dataValues.count_token})~~~~~~~ ${(listPort.RAW[data[i].dataValues.name_token].USD.PRICE*data[i].dataValues.count_token).toFixed(2)} $ \n\n ⌛1h  ${listPort.RAW[data[i].dataValues.name_token].USD.CHANGEPCTHOUR.toFixed(2).bold()}%  ⌛24H  ${listPort.RAW[data[i].dataValues.name_token].USD.CHANGEPCT24HOUR.toFixed(2).bold()}%  ⌛ALL ${procent.bold()}%\n\n`
        }else {
            textMess = textMess + `${i+1}) 🔴 ${data[i].dataValues.name_token} (${data[i].dataValues.count_token})~~~~~~~ ${(listPort.RAW[data[i].dataValues.name_token].USD.PRICE*data[i].dataValues.count_token).toFixed(2)} $ \n\n ⌛1h  ${listPort.RAW[data[i].dataValues.name_token].USD.CHANGEPCTHOUR.toFixed(2).bold()}%  ⌛24H  ${listPort.RAW[data[i].dataValues.name_token].USD.CHANGEPCT24HOUR.toFixed(2).bold()}%  ⌛ALL ${procent.bold()}%\n\n`
        }

    }

    bot.sendMessage(chatId, `Заплановане сповіщення.\nОсновний баланс : ${totalBalance.toFixed(1)}$ \n\n ${textMess}`, option)
}

async function blockNews(chatId, put){
    let list = await anyParseAPI(endUrlLink.news)
    let tmp =''
    // console.log(list.Data[0].id)

    for (let i = 0;i <10; i++){
        // tmp += `🎯 [${list.Data[i].title}](${list.Data[i].url})`
        tmp += `🎯  <a href="${list.Data[i].url}">${list.Data[i].title.bold()}</a> \n\n`
    }
    bot.sendMessage(chatId, tmp, {parse_mode:'HTML'})
    if (put == true){
        blockTimeMessageNews(chatId)
    }
}

async function blockTimeMessageNews(chatId){

    let data = await Times.findAll({where:{user_id: chatId}})
    let tf = false

    if (Object.keys(data).length == 0 || data == null){
        bot.sendMessage(chatId, `Ви ще не обирали час надсилання актуальних новин . Натисніть кнопку "Додати час" для того , щоб отримувати новини автоматично .`, {
            reply_markup:{
                keyboard:[
                    [`Додати час`],
                    [KB.back]
                ]
            }
        })
    }else {
        bot.sendMessage(chatId, `Актуальні новини `, {
            reply_markup:{
                keyboard:[
                    [`Додати час`,`Видалити час`],
                    [KB.back]
                ]
            }
        })
    }

    let text = await onText()

    for (let a = 0; a<Object.keys(data).length; a++){
        if (data[a].dataValues.date_news == text){
            tf = true
        }
    }

    if (tf == true){
        bot.sendMessage(chatId, `Порушені норми вводу тексту , таке налаштування часу вже існує .`)
        blockTimeMessageNews(chatId)
    }
    if (text == 'Додати час'){

        bot.sendMessage(chatId, `Введіть час в який хочите отримувати кожен день актуальних новин . Наприклад : ( 9:25 або 8:00)`)

        text = await onText()

        let arrCP = text.split(':')
        if (text == KB.back){

        }else if (arrCP == null || arrCP.length <= 1 || text.indexOf(':')==-1 || arrCP.length >= 3 || Number(arrCP[0])==null || Number(arrCP[1])==null || arrCP[0]>24 || arrCP[0] <0 || arrCP[1] >60 || arrCP[1]<0){
            bot.sendMessage(chatId, `Порушені норми вводу тексту , потрібно ввести у вигляді ГОДИНИ/ХВИЛИНИ (Наприклад :  9:25 або 8:00).`)
            blockTimeMessageNews(chatId)
        }else {
            bot.sendMessage(chatId, `Вітаємо , час успішно додано .`)

            Times.create({
                user_id: chatId,
                date_news: text
            }).then(result => {
                console.log(result)
            }).catch(err =>{
                console.log(err)
            })
        }


    }else if (text == 'Видалити час'){

        let tmp =''
        let arrTmp = [0]
        let checkNullAll = 0

        data = await Times.findAll({where:{user_id : chatId}})
        console.log(data)

        for (let b = 0; b<Object.keys(data).length; b++){
            if (data[b].dataValues.date_news == null){
                checkNullAll++
            }
        }

    // console.log(checkNullAll)

        if (text == KB.back){

        }else if (Object.keys(data).length == 0 || data == null || Object.keys(data).length == checkNullAll){
            bot.sendMessage(chatId, `У вас ще не налаштована ця фукція  .`)
            blockTimeMessageNews(chatId)
        }else if(Object.keys(data).length >= 1 ){
            let listIndex =0

            for (let i=0; Object.keys(data).length>i;i++){
                if (data[i].dataValues.date_news != null){
                    tmp = tmp + `${listIndex+1})  ${data[i].dataValues.date_news} ;\n`
                    arrTmp.push(data[i].dataValues.id)
                    listIndex++
                }
            }
            console.log(arrTmp)
            bot.sendMessage(chatId, `Ваші налаштування часу :\n${tmp}Для видалення певного часу потрібно написати індекс в чат (Наприклад : "1")`)
            text = await onText()

            if (text == KB.back){

            }else if (Number(text)>=1 && Number(text)<arrTmp.length){
                await Times.destroy({ where : {id: arrTmp[Number(text)]}})
                await bot.sendMessage(chatId, `Успішно видалено .`)
                start(chatId)
            }else {
                await bot.sendMessage(chatId, `Порушені правила вводу !`)
                start(chatId)
            }
        }

    }else if (text == KB.back){

    }

}

async function blockSignal(chatId) {

    let list
    let tmp =`⚠УВАГА⚠ Даний бот не дає ніяких гарантій , бот аналізує останні новини та технічні данні , ⛔БУДЬТЕ ОБЕРЕЖНІ⛔. \n\n `

    for (let i = 0; topCrypto.length>i; i++){
        list = await anyParseAPI(endUrlLink.signal+topCrypto[i])
        console.log(topCrypto[i]+' '+list.Data.inOutVar.sentiment)

        if (list.Data.inOutVar.sentiment == 'bearish'){

            tmp += `🐻🐻🐻 ${topCrypto[i]} - в даному випадку спостерігається медвежий тренд , тобто курс зменшується . Можливо було б непогано відкрити шорт позицію \n\n`

        }else if(list.Data.inOutVar.sentiment == 'neutral'){

            tmp += `🐢🐢🐢 ${topCrypto[i]} - в даному випадку спостерігається нейтральний тренд , тобто курс нестабільний . Можливо було б непогано не відкривати позиції \n\n`

        }else if (list.Data.inOutVar.sentiment == 'bullish'){

            tmp += `🐮🐮🐮 ${topCrypto[i]} - в даному випадку спостерігається бичий тренд , тобто курс збільшується . Можливо було б непогано відкрити лонг позицію \n\n`

        }

    }
    bot.sendMessage(chatId, tmp, {parse_mode:'HTML'})
    // console.log(list.Data[0].id)


}

setInterval(async function (){
    let date = new Date()
    let data = await Times.findAll()
    let target = await Targetmesses.findAll()
    let users = await Users.findAll()
    let tmp

    if (data.length>=1){
        for (let i=0;data.length>i;i++){

            if (data[i].dataValues.date_infoPortfolio == null && data[i].dataValues.date_news != null){
                tmp = data[i].dataValues.date_news.split(':')
                if (date.getHours() == tmp[0] && date.getMinutes() == Number(tmp[1])-1){
                   await blockNews(data[i].dataValues.user_id,false)
                }
            }else if (data[i].dataValues.date_infoPortfolio != null && data[i].dataValues.date_news == null){
                tmp = data[i].dataValues.date_infoPortfolio.split(':')
                if (date.getHours() == tmp[0] && date.getMinutes() == Number(tmp[1])-1){
                    await outputActive(data[i].dataValues.user_id,data[i].dataValues.id_wallet)
                }
            }
        }
    }

    if (target.length >= 1){
        for (let i=0;target.length>i;i++){
            tmp = target[i].dataValues.time.split(':')
            if (date.getHours() == tmp[0] && date.getMinutes() == Number(tmp[1])-1){
                for (let j=0;users.length>j;j++){
                    bot.sendMessage(users[j].dataValues.user_id, `${target[i].dataValues.mess}`)
                }
            }
        }
    }


},60000)

