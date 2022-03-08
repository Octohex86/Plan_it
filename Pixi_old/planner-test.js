// var ax;
// for (var iNum=0; iNum<6; iNum++){
// funcLoad(iNum);
// }

var lastJob=0;
var LastJpu=0;
// var newJob=new JobObj();
// var newJpu=new JpuObj();
// console.log(newJpu);
// console.log(newJob);
// console.log(lastJob);

//триггер на завершённый ajax-запрос
// $(document).ajaxComplete(function() {
//     // $( ".log" ).text( "Triggered ajaxComplete handler." );
//     console.log(ax);
// });


let type = "WebGL";
if(!PIXI.utils.isWebGLSupported()){
    type = "canvas"
}

// PIXI.utils.sayHello(type)

//Create a Pixi Application
let app = new PIXI.Application({
        width: 256,         // default: 800
        height: 256,        // default: 600
        antialias: true,    // default: false
        transparent: true, // default: false
        resolution: 1       // default: 1
    }
);
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);
app.renderer.view.style.position = "absolute";
app.renderer.view.style.display = "block";
app.renderer.autoResize = true;
app.renderer.resize(window.innerWidth, window.innerHeight);


const marineGreen=0x2f6556;
const greenFrog=0x7b917b;
const white=0xffffff;
const black=0;
const blueSky=0xbfff;
const orangeDawn=0xfd5e53;
const tolerance=0.0001;//минимальная длительность задачи; задачи, короче этой величины могут неправильно обрабатываться при расчёте связей
var maxJobs=6;
var gHeight=64;
var gVstep=80;
var initX=20;
var initY=20;

var maxWorkers=2;
var arRectY=[];//массив координат начала строк
for (var i=0; i<maxWorkers; i++){//генерация массива с координатой Y строк по числу исполнительных юнитов
    arRectY[i] = gVstep*i + initY;
}
var indicesTint=[];
var arNextJob=[];
var arPrevJob=[];

var mxJobNames =['Сделать 1','Сделать 2','Сделать 3','Сделать 4','Сделать 5','Сделать 6'];
var mxStart = [0,0,3.5,2,8,7];
var mxDur = [2,2,2,2,2,2];
var mxJPU=[1,2,1,2,1,2];
var jpuNames=['Вася','Геннадий'];
var softLinks=[[-Infinity,-Infinity,1,2,3,4,5,6],
                [1,2,3,4,5,6, Infinity, Infinity]];
var hardLinks=[[2,4],[4,5]];
var arJobs=[];
var arJpus=[];

// console.log(typeof arJpus[1]);

//!injection - определить номер задачи, после которой происходит вставка;
//!если задача не обнаружена, то по координате вычислить текущую !дату старта задачи и !дату её завершения, и её !исполнителя
////!проверить, что задача не имеет пересечений по времени с другими задачами этого же исполнителя (проверить поочерёдно все пары Finish1>Start2)
//!разорвать все старые софтлинк связи у перетаскиваемой задачи, а для этого выполнить поиск по софтлинк-массиву
//!определить, какие задачи идут непосредственно за ней в софтлинк;
//!выбрать ту, которая у этого же исполнителя;
//!записать текущую задачу в обе связки (в одну в качестве последователя, в другую в качестве предшественника;
//!вычислить время начала для текущей задачи
//определить, какие задачи идут непосредственно перед ней в хардлинк;
//определить наиболее позднее время завершения задач-предшественниц в хардлинк;
//если вычисленное время начала текущей задачи меньше, чем время окончания самого позднего предшественника в хардлинк, то всё ок, иначе присвоить одно другому
//вычислить время окончания задачи
//определить, какие задачи идут непосредственно за ней в хардлинк;
//определить наиболее ранее время старта задач-последователей в хардлинк;
//если вычисленное время окончания текущей задачи, меньше, чем время старта самого раннего последователя в хардлинк, то всё ок, иначе присвоить одно другому и пересчитать всех последователей самого раннего последователя
//
//отдельно подумать про обмен данными с сервером и технологию кэширования
//
//отдельно подумать про границы отображения и обрезку геометрии под границы для крайних задач
//
//отдельно подумать про возможных исполнителей для назначения задач - контролировать разрешение на заполнение строки конкретного исполнителя
//
//рассчитать сдвиг сроков вперёд можно дельтой от текущей задачи; в узлах, где несколько предшественников - дата старта является наибольшей датой окончания всех предшественников
//найти предшественников в хардлинк (для софтлинка дата старта высчитывается автоматически алгоритмом драгндропа)
//проверить их даты завершения; установить текущей задаче дату старта равной максимальной дате завершения среди всех предшественников
//
//расчёт сдвига сроков назад можно провести дельтой от задачи, следовавшей за текущей до сдвига, при этом дельта распространяется до узла, предшественники которого по альтернативной линии имеют более позднюю дату завершения
//проверить, есть ли альтернативные предшественники у текущей задачи (у задачи, которая стала текущей вместо вырезанной); найти минимальную дату завершения предшественников; установить её датой старта для текущей задачи;
//перейти к последователю, найти его всех предшественников, снова посчитать их даты завершения и т.д. повторять процедуру, пока распространение сигнала не прекратится.
//сигнал не распространяется далее, когда дата завершения текущей задачи с учётом сдвига оказывается меньше, чем дата завершения любого альтернативного предшественника
//либо, пока у текущей задачи не окажется последователей
//
//!для сдвига вперёд - сдвиг прекратится, когда текущая задача закончится раньше, чем начнётся следующая
//!найти последователей, записать в массив; проверить их времена начала, при необходимости провести сдвиг вперёд;
//
//для событийной модели: в событии передавать: id источника события, значение на временной шкале, которое ему необходимо занять
//получатель события рассчитывает дельту, на которую ему необходимо сдвинуться, двигается и генерирует новое событие для всех ближайших последующих узлов
//если сдвиг не требуется, либо отсутствуют последователи, новое событие не генерируется
//
//будущий сосед справа не должен начинаться раньше, чем возможное начало текущей задачи(проверить?-не годится)
//после определения минимально ранней даты старта и будущего исполнителя определять задачу, которая на этой дате; текущую ставить следующей за ней
//
//двигать задачу после последующей в хардлинк - тоже нельзя, приводит к циклу
//
//копировать массивы mxStart, mxJPU, softLinks и hardLinks далее работать с копиями, при успешном окончании операции переноса, заменить оригиналы копиями, отрисовать изменения
//при переносе: если i!=-1, то проверять...
//если задача-предшественник начинается позже максимально позднего возможного начала,
//если задача-последователь начинается позже максимально позднего возможного начала,


var oldTint=0;
var maxJpuNamesX=0;
var locX,locY,childIndex;//,ii;
var iiCurJobID, iiCurJobObj, prevJobObj;

var container = new PIXI.Container();
var containerMove = new PIXI.Container();
var containerJpuNames = new PIXI.Container();
var containerNewJobs = new PIXI.Container();


//переписать потом динамическую отрисовку исполнителей по мере загрузки задач с сервера
for (let i=0; i<maxWorkers; i++){
    containerJpuNames.addChild(new PIXI.Text(jpuNames[i]));
    var jpuNamesCoord=containerJpuNames.children[i].getLocalBounds();
    if (maxJpuNamesX<jpuNamesCoord.width){
        maxJpuNamesX=jpuNamesCoord.width;
    }
    var yt=gHeight/2-jpuNamesCoord.height/2+gVstep*(mxJPU[i]-1) + initY;
    var xt=initX;
    containerJpuNames.children[i].position.set(xt, yt);
}

document.getElementById("butLaunch").addEventListener("click", funcLaunch, false);//добавляем обработчик события на кнопку 1
document.getElementById("butSave").addEventListener("click", funcIncrement, false);//добавляем обработчик события на кнопку 2
document.getElementById("butLoad").addEventListener("click", funcLoad, false);//добавляем обработчик события на кнопку 3

document.getElementById("butLeft").addEventListener("mousedown", moveLeft, false);//добавляем обработчик события на кнопку 4
document.getElementById("butLeft").addEventListener("mouseup", moveLeftStop, false);//добавляем обработчик события на кнопку 4
document.getElementById("butRight").addEventListener("mousedown", moveRight, false);//добавляем обработчик события на кнопку 5
document.getElementById("butRight").addEventListener("mouseup", moveRightStop, false);//добавляем обработчик события на кнопку 5

document.getElementById("butNewJob").addEventListener("click", createNewJob, false);//добавляем обработчик события на кнопку 6


initX=2*initX+maxJpuNamesX;
maxJpuNamesX=initX;//сохранить начальное смещение для выравнивания ведра

for (let i=0; i<maxJobs; i++) {
    if (mxDur[i] !== 0) {
        var newJob = new JobObj();
        var newRect = new PIXI.Graphics();
        newJob.jobDur = mxDur[i];
        newJob.jobStart = mxStart[i];
        newJob.jpu = mxJPU[i];
        newJob.jobName = mxJobNames[i];
        newJob.jobID=i+1;
        newRect.jobID=newJob.jobID;//добавим атрибут - ссылку - jobID в pixi.graphics
        //проверить, существует ли объект jpu с указанным ID
        //если не существует, создать
        if((typeof arJpus[newJob.jpu])==='undefined'){
            // console.log('ha-ha');
            var newJpu=new JpuObj(newJob.jpu);
            newJpu.jpuName=jpuNames[i];
            newJpu.jobs.push(newJob);
            arJpus[newJob.jpu]=newJpu;
        }
        //если существует, то добавить задачу в массив задач исполнителя
        else{
            arJpus[newJob.jpu].jobs.push(newJob);
        }
        newJob.jpuObj=arJpus[newJob.jpu];
        newJob.pixiObj=newRect;
        let posPrevCurJob=softLinks[1].indexOf(i+1);
        newJob.sl.prev[0]=softLinks[0][posPrevCurJob];
        let posNextCurJob=softLinks[0].indexOf(i+1);
        newJob.sl.next[0]=softLinks[1][posNextCurJob];
        //заполнение хардлинк
        posPrevCurJob=hardLinks[1].indexOf(i+1);
        let countTemp=0;
        while (posPrevCurJob !== -1) {
            newJob.hl.prev[countTemp]=hardLinks[0][posPrevCurJob];
            posPrevCurJob = hardLinks[1].indexOf(i+1, posPrevCurJob+1);//продолжить искать со следующей позиции
            countTemp++;
        }
        posNextCurJob=hardLinks[0].indexOf(i+1);
        countTemp=0;
        while (posNextCurJob !== -1) {
            newJob.hl.next[countTemp]=hardLinks[1][posNextCurJob];
            posNextCurJob = hardLinks[1].indexOf(i+1, posNextCurJob+1);//продолжить искать со следующей позиции
            countTemp+=1;
        }

        var rectW = gHeight * newJob.jobDur;
        var rectH = gHeight;
        newRect.lineStyle(4, black, 1);
        newRect.beginFill(white);
        newRect.drawRect(0, 0, rectW, rectH);
        newRect.endFill();
        newRect.tint = marineGreen;
        // var rectX = gHeight * newJob.jobStart + initX;
        var rectX = gHeight * newJob.jobStart + initX;
        var rectY = gVstep * (newJob.jpu - 1) + initY;
        newRect.x = rectX;
        newRect.y = rectY;
        newRect.addChild(new PIXI.Text(newJob.jobName));
        var textCoord = newRect.children[0].getLocalBounds();
        var yt = rectH / 2 - textCoord.height / 2;
        var xt = rectW / 2 - textCoord.width / 2;
        newRect.children[0].position.set(xt, yt);
        newRect.interactive = true;
        newRect.buttonMode = true;
        newRect.on('pointerover', onPointerOver);
        newRect.on('pointerout', onPointerOut);
        newRect.on('pointerdown', onDragStart);
        newRect.on('pointerup', onDragEnd);
        // container.children[i].on('pointerupoutside', onDragEnd);
        newRect.on('pointermove', onDragMove);
        container.addChild(newRect);
        newJob.pixiContainer = container;
        newJob.pixiID = container.children.indexOf(newRect);
        arJobs[newJob.jobID]=newJob;
        // console.log(newJob);
    }
}
console.log(arJobs);
console.log(arJpus);


app.stage.addChild(container);
app.stage.addChild(containerMove);
app.stage.addChild(containerJpuNames);
app.stage.addChild(containerNewJobs);

var prevJPU;

function onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
    iiCurJobID=this.jobID;
    iiCurJobObj=arJobs[iiCurJobID];

    let newPosition = event.data.getLocalPosition(this);
    locX=newPosition.x;
    locY=newPosition.y;
    prevJPU=iiCurJobObj.jpu;
    // prevCurJob=iiCurJobObj.sl.prev[0];//если вдруг понадобится
    // nextCurJob=iiCurJobObj.sl.next[0];//если вдруг понадобится

    for (let countTemp=0; countTemp<iiCurJobObj.hl.prev.length; countTemp++) {
        let curJob=iiCurJobObj.hl.prev[countTemp];
        let curJobObj=arJobs[curJob];
        curJobObj.pixiObj.tint=blueSky;
        }
    indicesTint=iiCurJobObj.hl.prev.slice();

    //вычислим последователей текущей задачи
    for (let countTemp=0; countTemp<iiCurJobObj.hl.next.length; countTemp++) {
        let curJob=iiCurJobObj.hl.next[countTemp];
        let curJobObj=arJobs[curJob];
        curJobObj.pixiObj.tint=orangeDawn;
    }
    indicesTint=indicesTint.concat(iiCurJobObj.hl.next);
    childIndex=container.getChildIndex(this);
    container.removeChildAt(childIndex);
    containerMove.addChild(this);
}

function onDragEnd(event) {
    prevCurJob=iiCurJobObj.sl.prev[0];//если вдруг понадобится
    nextCurJob=iiCurJobObj.sl.next[0];//если вдруг понадобится
    // var i=app.stage.children.indexOf(this);
    //провести hitTest для 4 точек по левому краю

    let dropPosition1 = event.data.getLocalPosition(this.parent);
    let dropPosition2 = event.data.getLocalPosition(this.parent);
    let dropPosition3 = event.data.getLocalPosition(this.parent);
    // var dropPosition4 = event.data.getLocalPosition(this.parent);

    dropPosition1.x = dropPosition1.x - locX;//левый верхний угол
    dropPosition1.y = dropPosition1.y - locY;//левый верхний угол
    dropPosition2.x = dropPosition2.x - locX;//левый нижний угол
    dropPosition2.y = dropPosition2.y - locY + gHeight;//левый нижний угол
    dropPosition3.x = dropPosition3.x - locX;//левая верхняя точка
    dropPosition3.y = dropPosition3.y - locY + gHeight - gVstep / 2;//левая верхняя точка
    // dropPosition4.x=dropPosition4.x-locX;//левый верхний угол
    // dropPosition4.y=dropPosition4.y-locY+gVstep/2;//левая нижняя точка

    var targetJob1 = app.renderer.plugins.interaction.hitTest(dropPosition1, container);//добавить проверку дополнительных точек, чтобы однозначнее определять соседей
    var targetJob2 = app.renderer.plugins.interaction.hitTest(dropPosition2, container);//добавить проверку дополнительных точек, чтобы однозначнее определять соседей
    var targetJob3 = app.renderer.plugins.interaction.hitTest(dropPosition3, container);//добавить проверку дополнительных точек, чтобы однозначнее определять соседей
    // var targetJob4=app.renderer.plugins.interaction.hitTest(dropPosition4,container);//добавить проверку дополнительных точек, чтобы однозначнее определять соседей
    if (targetJob1 === targetJob3) {
        var i = container.children.indexOf(targetJob1);
        if (i!==-1){
            prevJobObj=arJobs[targetJob1.jobID];
            // curJpu=targetJob1.jpuObj;
        }
    }
    else {
        var i = container.children.indexOf(targetJob2);
        if (i!==-1) {
            prevJobObj = arJobs[targetJob2.jobID];
        }
    }
    /////////////////////////////////////
    if (i === -1) {//если i равно -1, значит исполнителя и время старта надо вычислять по координатам точки  dropPosition1
        //вычислить к какой из строк в массиве arRectY ближе всего значение dropPosition1.y
        let difTemp0 = Number.MAX_SAFE_INTEGER;
        var difTemp1, strNumber;
        for (let itemp = 0; itemp < maxWorkers; itemp++) {
            difTemp1 = Math.abs(arRectY[itemp] - dropPosition1.y);
            if (difTemp1 <= difTemp0) {
                difTemp0 = difTemp1;
                strNumber = itemp;
            }
        }
        // rectX = gHeight * mxStart[i] + initX;// mxStart - дата старта
        var startCurJob = (dropPosition1.x - initX) / gHeight;//дата старта текущей задачи, которую перетащили и бросили в пустое место
        // alert('по пустому месту'+String(startCurJob));

    }
    else {
        // strNumber=prevJobObj.jpu-1;
        strNumber=prevJobObj.jpuObj.strNumber+0;//newJob.jpuObj
        startCurJob = prevJobObj.jobStart + prevJobObj.jobDur;//дата старта текущей задачи ii, которую перетащили и бросили на другую задачу i
        // alert('по предыдущей задаче'+String(startCurJob));
    }
//исправляем софтлинки в соответствии с действиями пользователя
//добавить алгоритм вычисления последователей и предшественников в софтлинк, если задача вставлена в пустое место!
//вариант вставки - она пересекается завершением со следующей задачей, тогда связать с ней и её предшественником (если предшественник существует)
//вариант вставки - она ни с кем не пересекается вообще, тогда поискать предшественников и последователей у этого исполнителя в этом временном диапазоне, прицепиться к ближайшим
//не нужно писать в массив всякие undefined и по адресам -1 тоже не писать!
//считать последней задачей ту, у которой в харддинке нет последователей
//первой - ту, у которой в хардлинке нет предшественников
var minOrMaxFlag=null;
    //ищем всех предшественников текущей задачи ii, чтобы ограничить перемещение назад
//перебираем по списку предшественников, сформированному при начале перетаскивания
var safeStartCurJob=startCurJob+0;
    // var minSafeFlag=null;
    // var minSafePossibleStart=Number.MAX_SAFE_INTEGER;
    for (let countTemp=0; countTemp<iiCurJobObj.hl.prev.length; countTemp++){
        let PrevCurJob=iiCurJobObj.hl.prev[countTemp];
        let prevCurJobObj=arJobs[PrevCurJob];
        // var minPossibleStart=mxStart[PrevCurJob]+mxDur[PrevCurJob];
        var minPossibleStart=prevCurJobObj.jobStart+prevCurJobObj.jobDur;
        var newMinSafePossibleStart=prevCurJobObj.jobStart+prevCurJobObj.jobDur;
        // if(newMinSafePossibleStart<minSafePossibleStart){
        //     minSafePossibleStart=newMinSafePossibleStart+0;
        //     minSafeFlag=1;
        // }
        // var minPossibleStart=prevCurJobObj.jobStart;
        if (minPossibleStart>startCurJob) {//потомучто в hardLinks я записал задачи, начиная с первой, а не с нулевой
            startCurJob=minPossibleStart-tolerance;//поправка
            var minPossibleSafeStart=startCurJob+0;
            // var startCurJob=minPossibleStart-tolerance;//поправка
            i=-1;//здесь происходит сдвиг вправо, если задача смещена раньше, чем может начаться согласно связям в хардлинк
            //дальше надо определить, какая сейчас задача находится в этом месте и поставить текущую на это время перед ней
            minOrMaxFlag=1;

            // var minSafePossibleStart=prevCurJobObj.jobStart;
        }
    }
    // if (minOrMaxFlag===1){
    //     startCurJob=minSafePossibleStart+tolerance;
    // }

//перебираем по списку последователей, чтобы ограничить перемещение вперёд - максимальное время окончания не должно превышать время старта раннего последователя из хардлинк
    for (let countTemp=0; countTemp<iiCurJobObj.hl.next.length; countTemp++){
        let nextCurJob=iiCurJobObj.hl.next[countTemp];
        let nextCurJobObj=arJobs[nextCurJob];
        // var maxPossibleStart=mxStart[nextCurJob]-mxDur[ii];
        // var maxPossibleStart=nextCurJobObj.jobStart-iiCurJobObj.jobDur;
        var maxPossibleStart=nextCurJobObj.jobStart;
        if (maxPossibleStart<startCurJob) {//потомучто в hardLinks я записал задачи, начиная с первой, а не с нулевой
            startCurJob=maxPossibleStart-tolerance;//поправка
            i=-1;//здесь происходит сдвиг вправо, если задача смещена раньше, чем может начаться согласно связям в хардлинк
            //дальше надо определить, какая сейчас задача находится в этом месте и поставить текущую на это время перед ней
            minOrMaxFlag=2;
        }
    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //проверить i - номер задачи-предшественника
    //strNumber - текущий исполнитель задачи
    //ii - номер текущей задачи
    // var prevJob, nextJob;
    var prevJob=-Infinity;
    var nextJob=Infinity;
    var nextCurJob,posPrevCurJob,posCurJob,posPrevJob,prevCurJob;
    if (i === -1) {//если i равно -1, значит задача была отпущена где попало,//чтобы вычислить соседей необходимо проверить пересечения со всеми задачами текущего исполнителя по времени
        var minLeftN = Number.MAX_SAFE_INTEGER;
        var minRightN = Number.MAX_SAFE_INTEGER;
        // var prevJob=-Infinity;
        // var nextJob=Infinity;
        //потом переписать, когда добавится отдельный массив с jpuID и соответствие строк на экране исполнителям
        //итерирование по всем задачам исполнителя, соответствующего строке на экране, где была отпущена текущая задача
        // var CurJpuJob = mxJPU.indexOf(strNumber+1);//индекс задачи текущего исполнителя в общем списке задач
        for (let itemp=0; itemp<arJpus.length; itemp++) {
            if (typeof arJpus[itemp] !== 'undefined') {
                if (arJpus[itemp].strNumber === strNumber) {
                    var curJpu = arJpus[itemp];//поиск того самого исполнителя, у которого прописана та же строка, что и брошенной задачи
                    break;
                }
            }
        }
        // strNumber

        for (let itemp=0; itemp<curJpu.jobs.length; itemp++) {
            let curJpuJobObj = curJpu.jobs[itemp];//индекс задачи текущего исполнителя в общем списке задач
            if (curJpuJobObj !== iiCurJobObj) {
                let leftN = startCurJob - curJpuJobObj.jobStart;
                if (leftN >= 0) {
                    if (leftN < minLeftN) {
                        minLeftN = leftN;
                        prevJob = curJpuJobObj.jobID + 0;
                    }
                }
                else {
                    // var rightN = mxStart[CurJpuJob]-startCurJob;
                    var rightN = curJpuJobObj.jobStart - startCurJob;
                    if (rightN < minRightN) {
                        minRightN = rightN;
                        nextJob = curJpuJobObj.jobID + 0;
                    }
                }

            }
        }
        // var CurJpuJob = mxJPU.indexOf(strNumber+1);//индекс задачи текущего исполнителя в общем списке задач



        ///////////////////////////////////////////////
        // while (CurJpuJob !== -1) {
        //     CurJpuJob++;
        //     if (CurJpuJob!==iiCurJobID) {
        //         // var leftN = startCurJob - (mxStart[CurJpuJob] + mxDur[CurJpuJob]);
        //         // var leftN = startCurJob - (arJobs[CurJpuJob].jobStart+arJobs[CurJpuJob].jobDur);
        //         var leftN = startCurJob - arJobs[CurJpuJob].jobStart;
        //         if (leftN >= 0) {
        //             if (leftN < minLeftN) {
        //                 minLeftN = leftN;
        //                 prevJob = CurJpuJob;
        //             }
        //         }
        //         else {
        //             // var rightN = mxStart[CurJpuJob]-startCurJob;
        //             var rightN = arJobs[CurJpuJob].jobStart-startCurJob;
        //             if (rightN < minRightN) {
        //                 minRightN = rightN;
        //                 nextJob = CurJpuJob;
        //             }
        //         }
        //     }
        //     CurJpuJob = mxJPU.indexOf(strNumber+1, CurJpuJob);//1 уже прибавили к CurJpuJob
        // }
        ///////////////////////////////////////////////
        // nextJob;
        // prevJob;
        // console.log(prevJob, nextJob);
    }
    else {
        curJpu=prevJobObj.jpuObj;
        prevJob=prevJobObj.jobID;
        if (prevJob!==prevCurJob) {
            //     nextJob = softLinks[1][posPrevJob];//задача - поздний сосед, новая следующая задача для перенесённой текущей; в альтернативном варианте она находится другим способом
            nextJob=prevJobObj.sl.next[0]+0;
        }
        else{
            nextJob=iiCurJobObj.sl.next[0]+0;
        }
    }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // var endCurJob=startCurJob+mxDur[ii];//дата завершения текущей задачи, которую перетащили и бросили
    //добавить связывание старых соседских задач, до того, как была убрана текущая
    //posPrevJob - позиция в софтлинк[0] задачи-предшественника текущей, до её переноса
    //
    //ii - текущая задача
    //prevCurJob - задача-предшественник текущей, её позиция в софтлинк[0]-posPrevCurJob
    //nextCurJob - задача-последователь текущей
    //i, prevJob (ветвление) задача, на которую произошёл перенос, её позиция в софтлинке[0] posPrevJob
    //nextJob (ветвление) - задача последователь той, на которую произошёл перенос
    //
    //
    // posPrevCurJob = softLinks[1].indexOf(ii+1);//позиция задачи, предшествовавшей текущей, в софтлинк[0]
    // prevCurJob=softLinks[0][posPrevCurJob];//если вдруг понадобится




//всё прочитали из массива
    //posPrevJob - позиция задачи-позднего соседа на новом месте в софтлинк[1]

    // nextCurJob=softLinks[1][ii];
    //записать только в том случае, если не образуется закольцованности!

    // if (minPossibleStart>mxStart[i]){
    // arPrevJob=[];//чистим за собой массив
    // var flagCycle=false;
    // if (i===-1){
    //     var minPossibleStart=mxStart[prevJob]+mxDur[prevJob];
    //     if (startCurJob<=minPossibleStart){
    //         alert('это приведёт к закольцованности, так делать нельзя!');
    //         flagCycle=true;
    //     }
    // }
    // else{
    //     var minPossibleStart=mxStart[i]+mxDur[i];
    //     if (startCurJob>=minPossibleStart){
    //         alert('это приведёт к закольцованности, так делать нельзя!');
    //         flagCycle=true;
    //     }
    // }
//теперь запись в массив
//         if (flagCycle===false) {
//     softLinks[1][posPrevCurJob] = nextCurJob;//склейка задач в месте выреза текущей
    if (prevCurJob!==-Infinity) {
        arJobs[prevCurJob].sl.next[0] = nextCurJob + 0;
    }
    if (nextCurJob!==Infinity) {
        arJobs[nextCurJob].sl.prev[0] = prevCurJob + 0;
    }

    // softLinks[1][posNextCurJob] = nextJob;
    iiCurJobObj.sl.next[0]=nextJob+0;
    if (nextJob!==Infinity) {
        arJobs[nextJob].sl.prev[0] = iiCurJobID + 0;
    }
    // softLinks[1][posPrevJob] = ii + 1;//
    iiCurJobObj.sl.prev[0]=prevJob+0;
    if (prevJob!==-Infinity) {
        arJobs[prevJob].sl.next[0] = iiCurJobID + 0;
    }

    //если значение в softLinks[1][posPrevCurJob] изменилось, значит необходимо запустить процедуру сдвига назад с задачи nextCurJob
    //так же надо проверить, сменился ли исполнитель у перетаскиваемой задачи
    // if (softLinks[1][posPrevCurJob] === (ii + 1)) {
    //     console.log('последовательность задач не поменялась');
    // }
    // if (prevJPU !== (strNumber + 1)) {
    //     console.log('изменился исполнитель');
    // }
    // console.log(softLinks);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //было тут!
    ///

    if (minOrMaxFlag===2) {
//     let prevJobEnd=null;
        if (prevJob !== -Infinity) {
            let prevJobEnd = arJobs[prevJob].jobStart + arJobs[prevJob].jobDur;
            if (safeStartCurJob < prevJobEnd) {
                startCurJob = prevJobEnd+0;
                // startCurJob = safeStartCurJob + 0;
            }
            // else {
            //     startCurJob = prevJobEnd;
            // }
        }
        else {
            startCurJob = safeStartCurJob + 0;
        }
    }
    if(minOrMaxFlag===1){
        if (prevJob !== -Infinity) {
            let prevJobEnd = arJobs[prevJob].jobStart + arJobs[prevJob].jobDur;
            if (safeStartCurJob < prevJobEnd) {
                startCurJob = prevJobEnd + 0;
                // startCurJob = safeStartCurJob + 0;
            }
        }
        else {
            startCurJob -= tolerance;//поправка
        }
        if (startCurJob<minPossibleSafeStart){
            startCurJob=minPossibleSafeStart;
        }
        // if ()
        // startCurJob=minSafePossibleStart+0;//поправка
        // startCurJob=minSafePossibleStart+0;
    }
    // else{
    //     if (minSafeFlag==1) {
    //         startCurJob = minSafePossibleStart + 0;
    //     }
    // }

//     if (minOrMaxFlag===1){
//         startCurJob = safeStartCurJob + 0;
//     }
    // }
    this.y = gVstep * (strNumber) + initY;
    this.x = gHeight * startCurJob + initX;
    // console.log('завершение переноса, задача номер',ii,'rectX',rectX);//отладка
    // console.log('x',this.x);//отладка

    //записываем новые даты старта задач и новых исполнителей
    // mxStart[ii] = startCurJob;
    // startCurJob=safeStartCurJob+0;
    iiCurJobObj.jobStart=startCurJob+0;
    // mxJPU[iiCurJobID-1] = strNumber + 1;//оставить временно, пока не будет отдельный массив с исполнителями
    itemp=iiCurJobObj.jpuObj.jobs.indexOf(iiCurJobObj);
    iiCurJobObj.jpuObj.jobs.splice(itemp,1);
    //найти позицию текущей задачи в массиве задач предыдущего исполнителя, удалить его оттуда
    //дописать текущую задачу новому исполнителю в массив задач
    iiCurJobObj.jpuObj = curJpu;
    iiCurJobObj.jpu=strNumber+0;
    curJpu.jobs.push(iiCurJobObj);



    this.alpha = 1;
    this.dragging = false;
    // set the interaction data to null
    this.data = null;


    // alert('ты отпустил задачу над '+mxJobNames[i]);

    //arNextJob-массив с последователями из хардлинк
    containerMove.removeChild(this);
    container.addChildAt(this, childIndex);//добавим задачу обратно в контейнер графических объектов, чтобы восстановить в нём начальную нумерацию
    childIndex = null;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //если arNextJob непустой, значит дети первого узла уже найдены, надо их только обойти и посдвигать; тех, кто не сдвинулся, выкинуть из списка
    //если пустой, значит детей первого узла и не было, тогда пропустить весь дальнейший код и сразу на завершение функции (не забыть дописать)
    //в процессе обхода сформировать новый список тех, кто сдвинулся arCurNodes, дальше передать список на поиск новых детей
//дописать в arNextJob ближайшего последователя из софтлинк
//     arNextJob=iiCurJobObj.hl.next.slice();//взять всех последователей из хардлинк
//     if (nextJob !== Infinity) {
//         // if (arNextJob)
//         arNextJob.push(nextJob);// - 1);
//     }

//теперь осталось найти вообще всех последователей, в том числе и в софтлинк
    let arCurNodes = [];
    arCurNodes.push(iiCurJobID);
    let curNode;

    // arNextJob = [];//почистим за собой, чтобы при перетаскивании задач, которых нет в хардлинке, не происходило сбоя
    while (arCurNodes.length !== 0) {
        let arChildNodes = [];
        for (let i = 0; i < arCurNodes.length; i++) {
            curNode = arCurNodes[i];
            // var endCurNode = mxStart[curNode] + mxDur[curNode];
            let endCurNode = arJobs[curNode].jobStart + arJobs[curNode].jobDur;
            //сюда вставить поиск по софтлинку
            // var posChildNode = softLinks[0].indexOf(curNode + 1);
            // var childNode = softLinks[1][posChildNode];
            let childNode = arJobs[curNode].sl.next[0];
            //добавить бы проверку на бесконечность
            if (childNode!==Infinity) {
                // var startChildNode = mxStart[childNode - 1];
                let startChildNode = arJobs[childNode].jobStart;
                if (endCurNode > startChildNode) {//потомучто в hardLinks я записал задачи, начиная с первой, а не с нулевой
                    let delta = endCurNode - startChildNode;
                    // startChildNode = endCurNode;//всем найденным детям записать новые времена старта
                    // mxStart[childNode - 1] = endCurNode;
                    arJobs[childNode].jobStart = endCurNode+0;
                    arChildNodes.push(childNode);//всех найденных детей дописать в массив следующего шага, если их необходимо сдвинуть
                    // container.children[childNode - 1].x = container.children[childNode - 1].x + delta * gHeight;
                    container.children[arJobs[childNode].pixiID].x += delta * gHeight;
                    console.log(delta);
                }
            }
            //дальше поиск по хардлинку
            // posChildNode = hardLinks[0].indexOf(curNode + 1);//потомучто в hardLinks я записал задачи, начиная с первой, а не с нулевой
            // while (posChildNode !== -1) {
            for (let itemp=0; itemp<arJobs[curNode].hl.next.length; itemp++)
            {
                // childNode = hardLinks[1][posChildNode];
                childNode = arJobs[curNode].hl.next[itemp];
                // startChildNode = mxStart[childNode - 1];
                // startChildNode = mxStart[childNode - 1];
                let startChildNode = arJobs[childNode].jobStart;
                // var minPossibleStart=mxStart[PrevCurJob-1]+mxDur[PrevCurJob-1];
                if (endCurNode > startChildNode) {//потомучто в hardLinks я записал задачи, начиная с первой, а не с нулевой
                    let delta = endCurNode - startChildNode;
                    // startChildNode = endCurNode;//всем найденным детям записать новые времена старта
                    // mxStart[childNode - 1] = endCurNode;
                    arJobs[childNode].jobStart = endCurNode+0;
                    arChildNodes.push(childNode);//всех найденных детей дописать в массив следующего шага, если их необходимо сдвинуть
                    // container.children[childNode - 1].x = container.children[childNode - 1].x + delta * gHeight;
                    container.children[arJobs[childNode].pixiID].x += delta * gHeight;
                    console.log(delta);
                }
                // indices.push(prevCurJob);
                // posChildNode = hardLinks[0].indexOf(curNode + 1, posChildNode + 1);//продолжить искать со следующей позиции
                // }
            }
        }
        arCurNodes = arChildNodes.slice();
    }
    // }
    // console.log(mxStart);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//здесь будет уплотнение задач - сдвиг назад с выбором всех имеющихся пустот


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//раскрашиваем подсвеченные при старте переноса задачи обратно в нейтральный цвет

    for (var itemp=0; itemp<indicesTint.length; itemp++) {
        var tempIndex=indicesTint[itemp]-1;
        container.children[tempIndex].tint=marineGreen;
        // container.children[PrevCurJob - 1].tint = blueSky;
    }
    indicesTint=[];
    iiCurJobID=null;
    iiCurJobObj=null;
    // ii=null;
}

function onDragMove() {
    if (this.dragging) {
        var newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x-locX;
        this.y = newPosition.y-locY;
    }
}
function onMouseClick(event){
    var i=app.stage.children.indexOf(this);
    alert('ты нажал на '+mxJobNames[i]);
}
function onPointerOver(){
    oldTint=this.tint;
    // this.tint=0xff9218;
    this.tint=greenFrog;
}
function onPointerOut(){
    if (oldTint!==0){
        this.tint=oldTint;
    }
}

function funcSave(){
    $.post("cgi-bin/pixi_test.py",//на какой обработчик сервера передаём
        {
            "a":$('#inp1').val(),
            "b":$('#inp2').val()
            // "a":2,
            // "b":3
        },//что передаём
        function(data){//функция-обработчик ответа сервера и переменная с самим ответом
            console.log(data);
        })
}


function funcLoad(){
    $.post("cgi-bin/get_num.py",//на какой обработчик сервера передаём
        {
            // "a":'getData',
            // "b":iNum
        },//что передаём
        function(data){//функция-обработчик ответа сервера и переменная с самим ответом

            try {
                let parsedData = JSON.parse(data);
                let newRect=new PIXI.Graphics();
                container.addChild(newRect);
                let rectW = gHeight * parsedData.duration;
                let rectH = gHeight;
                newRect.lineStyle(4, black, 1);
                newRect.beginFill(white);
                newRect.drawRect(0, 0, rectW, rectH);
                newRect.endFill();
                newRect.tint=marineGreen;
                let rectX = gHeight * parsedData.start + initX;
                let rectY = gVstep*(parsedData.jpu-1) + initY;
                newRect.x=rectX;
                newRect.y=rectY;
            }
            catch(e){
                console.log(data);
            }

            // if (typeof parsedData.duration === "undefined") {
            //     // alert("GOT THERE");
            //     console.log(data);
            // }
            // else{
            //     // var parsedData=JSON.parse(data);
            //
            //
            //     // ax=data;
            //     console.log(parsedData)
            // }
        }
        // "json");
    );
}

function funcLaunch() {
    $.post("cgi-bin/test_server.py",//на какой обработчик сервера передаём
        {
            // "a":'getData',
            // "b":iNum
        },//что передаём
        function (data) {//функция-обработчик ответа сервера и переменная с самим ответом
            // if data==
            console.log(data);
        });
}

function funcIncrement() {
    $.post("cgi-bin/increment.py",//на какой обработчик сервера передаём
        {
            // "a":'getData',
            // "b":iNum
        },//что передаём
        function (data) {//функция-обработчик ответа сервера и переменная с самим ответом
            // if data==
            console.log(data);
        });
}

function moveLeft(){
    // var count=100;
    app.ticker.add(moveLeftFunc=function(){
        let count=20;
        initX=initX+count;
        for (let i = 0; i < container.children.length; i++) {
            container.children[i].x = container.children[i].x + count;
        }
    });
}

function moveLeftStop(){
    app.ticker.remove(moveLeftFunc)
}

function moveRight(){
    // var count=0.5;
    app.ticker.add(moveRightFunc=function(){
        let count=20;
        initX=initX-count;
        for (let i = 0; i < container.children.length; i++) {
            container.children[i].x = container.children[i].x - count;
        }
    });
}

function moveRightStop(){
    app.ticker.remove(moveRightFunc)
}

var cursorNewJob=0;
function createNewJob(){
    let newJob=new JobObj();
    let newRect=new PIXI.Graphics();
    let rectW = gHeight * newJob.jobDur;
    let rectH = gHeight;
    newRect.lineStyle(4, black, 1);
    newRect.beginFill(white);
    newRect.drawRect(0, 0, rectW, rectH);
    newRect.endFill();
    newRect.tint=marineGreen;
    // var rectX = gHeight * newJob.jobStart + initX;
    let rectX = maxJpuNamesX;
    let rectY = gVstep*(cursorNewJob+maxWorkers) + initY;
    newRect.x=rectX;
    newRect.y=rectY;
    newJob.pixiContainer=containerNewJobs;
    containerNewJobs.addChild(newRect);
    newJob.pixiID=containerNewJobs.children.indexOf(newRect);

    newRect.addChild(new PIXI.Text(newJob.jobName));
    let textCoord=newRect.children[0].getLocalBounds();
    let yt=rectH/2-textCoord.height/2;
    let xt=rectW/2-textCoord.width/2;
    newRect.children[0].position.set(xt, yt);


    // console.log(newJob.pixiID);
    cursorNewJob+=1;//отрисовка задач в столбик в ведре
    console.log(newJob);
}










function JobLink(){
    this.prev=[];
    // this.prev[0]=prev;
    this.next=[];
    // this.next[0]=next;
}


function JobObj (jobID=lastJob+1, pixiID=undefined, pixiObj=undefined, pixiContainer=container, jobName='Сделать '+(lastJob+1).toString(), jobText='',jobStart=undefined,jobDur=2,jpu=undefined, jpuObj=undefined) {
    lastJob++;
    this.jobID = jobID;
    this.pixiID = pixiID;
    this.pixiObj = pixiObj;
    this.pixiContainer=pixiContainer;
    this.jobName = jobName;
    this.jobText=jobText;
    this.jobStart=jobStart;
    this.jobDur=jobDur;
    this.jpu=jpu;
    this.jpuObj=jpuObj;
    this.sl=new JobLink();
    this.hl=new JobLink();
    this.jobClass=undefined;
}

function JpuObj(jpuID=LastJpu, jpuName='Вася '+LastJpu.toString(), jobs=[], strNumber=LastJpu, availJobClasses=[]){
    LastJpu++;
    this.jpuID=jpuID;
    this.jpuName=jpuName;
    this.jobs=jobs;
    this.strNumber=strNumber;
    this.availJobClasses=availJobClasses;
}








