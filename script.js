document.getElementById('shiftForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const startTime = parseInt(document.getElementById('startTime').value);
    const shiftDuration = parseInt(document.getElementById('shiftDuration').value);
    const totalShifts = parseInt(document.getElementById('totalShifts').value);
    const bandNames = document.getElementById('bandNames').value.split(',').map(b => b.trim());

    const shifts = generateShifts(startTime, shiftDuration, totalShifts, bandNames);
    displayShifts(shifts);
    makeTableDraggable();
});

// プリセット保存ボタン
document.getElementById('savePresetButton').addEventListener('click', function() {
    const preset = {
        startTime: document.getElementById('startTime').value,
        shiftDuration: document.getElementById('shiftDuration').value,
        totalShifts: document.getElementById('totalShifts').value,
        bandNames: document.getElementById('bandNames').value
    };

    localStorage.setItem('shiftPreset', JSON.stringify(preset));
    alert('プリセットが保存されました。');
});

// プリセット読み込みボタン
document.getElementById('loadPresetButton').addEventListener('click', function() {
    const preset = JSON.parse(localStorage.getItem('shiftPreset'));

    if (preset) {
        document.getElementById('startTime').value = preset.startTime;
        document.getElementById('shiftDuration').value = preset.shiftDuration;
        document.getElementById('totalShifts').value = preset.totalShifts;
        document.getElementById('bandNames').value = preset.bandNames;
        alert('プリセットが読み込まれました。');
    } else {
        alert('保存されたプリセットが見つかりません。');
    }
});

function generateShifts(startTime, shiftDuration, totalShifts, bandNames) {
    const shifts = [];
    const bandCount = bandNames.length;
    const bandAssignments = Array(bandCount).fill(0);
    const assignedToAVRoom = [];

    let currentTime = startTime;

    for (let i = 0; i < totalShifts; i++) {
        const shiftBands = [];

        // 視聴覚室にバンドを割り当てる
        let selectedBandAV;
        do {
            selectedBandAV = getLeastAssignedBand(bandAssignments, bandNames);
        } while (assignedToAVRoom.includes(selectedBandAV));

        shiftBands.push(selectedBandAV);
        assignedToAVRoom.push(selectedBandAV);
        bandAssignments[bandNames.indexOf(selectedBandAV)]++;

        // 他の部屋にバンドを割り当てる
        for (let j = 1; j < 5; j++) {  // 2番目の部屋からスタート
            let selectedBand;

            do {
                selectedBand = getLeastAssignedBand(bandAssignments, bandNames);
            } while (shiftBands.includes(selectedBand));

            shiftBands.push(selectedBand);
            bandAssignments[bandNames.indexOf(selectedBand)]++;
        }

        // 連続シフトのチェック
        if (i > 0) {
            while (shiftBands.some((band, index) => band === shifts[i-1][`location${index+1}`])) {
                shiftBands.sort(() => 0.5 - Math.random());  // 連続するバンドがないように再シャッフル
            }
        }

        shifts.push({
            time: formatTime(currentTime),
            location1: shiftBands[0],  // 視聴覚
            location2: shiftBands[1],  // 部室
            location3: shiftBands[2],  // 3-3
            location4: shiftBands[3],  // 3-2
            location5: shiftBands[4]   // 3-1
        });

        currentTime += shiftDuration;
        if (currentTime % 100 >= 60) {
            currentTime += 40;
        }
    }

    return shifts;
}

function getLeastAssignedBand(bandAssignments, bandNames) {
    const minAssignments = Math.min(...bandAssignments);
    const candidates = bandNames.filter((_, i) => bandAssignments[i] === minAssignments);
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function formatTime(time) {
    const hours = Math.floor(time / 100);
    const minutes = time % 100;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function displayShifts(shifts) {
    const scheduleOutput = document.getElementById('scheduleOutput');
    scheduleOutput.innerHTML = '';

    const table = document.createElement('table');
    table.id = 'shiftTable';
    const headerRow = table.insertRow();
    ['時間', '視聴覚', '部室', '3-3', '3-2', '3-1'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    shifts.forEach(shift => {
        const row = table.insertRow();
        Object.values(shift).forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
            cell.draggable = true;  // ドラッグ可能にする
            cell.addEventListener('dragstart', handleDragStart);
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', handleDrop);
        });
    });

    scheduleOutput.appendChild(table);
}

function makeTableDraggable() {
    const table = document.getElementById('shiftTable');
    const cells = table.getElementsByTagName('td');
    for (const cell of cells) {
        cell.draggable = true;
        cell.addEventListener('dragstart', handleDragStart);
        cell.addEventListener('dragover', handleDragOver);
        cell.addEventListener('drop', handleDrop);
    }
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedElement !== e.target) {
        const temp = draggedElement.textContent;
        draggedElement.textContent = e.target.textContent;
        e.target.textContent = temp;
    }

    return false;
}

