let currentWeek = 0; // По умолчанию загружаем первую неделю
let currentDay = 'monday'; // Задаем начальный день недели
let displayMode = 'list'; // По умолчанию режим отображения - список

// Функция для изменения режима отображения
function setDisplayMode(mode) {
    console.log("setDisplayMode");
    displayMode = mode;
    loadDaySchedule(currentDay, currentWeek);
    updateDisplayModeButtons();
}

// Функция для обновления стиля кнопок режима отображения
function updateDisplayModeButtons() {
    // Сбросить все активные классы
    document.querySelectorAll('.display-mode-selector button').forEach(button => {
        button.classList.remove('active');
    });

    // Активировать нужную кнопку
    const activeButton = document.getElementById('mode-' + displayMode);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Объект для перевода названий дней недели на русский язык
const daysTranslation = {
    'monday': 'Понедельник',
    'tuesday': 'Вторник',
    'wednesday': 'Среда',
    'thursday': 'Четверг',
    'friday': 'Пятница',
    'saturday': 'Суббота',
    'sunday': 'Воскресенье'
};

function switchSemester(semester) {
    currentSemester = semester;
    loadSchedule(); // Перезагружает расписание с учётом выбранного семестра
}

// Словарь для хранения расписания
let schedule = {};

let currentSemester; // Удаляем начальное значение

// Функция для загрузки расписания
function loadSchedule() {
    console.log("loadSchedule");
    fetch('schedule.json')
        .then(response => {
            console.log("Response received", response);

            // Проверяем, был ли успешным запрос
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.json();
        })
        .then(data => {
            console.log("JSON data", data);
            // Определение и установка самого последнего семестра перед обновлением селектора
            if (!currentSemester) {
                const semesters = Object.keys(data);
                currentSemester = semesters[semesters.length - 1]; // Последний семестр становится текущим
                console.log("Current semester set to", currentSemester);
            }

            updateSemesterSelector(data); // Обновляем селектор с семестрами

            schedule = data[currentSemester]; // Загружаем расписание для текущего семестра
            console.log("Schedule for current semester", schedule);
            selectClosestDayWithClasses(); // Новый вызов функции для выбора ближайшего дня
        })
        .catch(error => console.error('Ошибка при загрузке расписания:', error));
}

function getDaysDifference(date1, date2) {
    // Преобразуем даты в миллисекунды
    const time1 = date1.getTime();
    const time2 = date2.getTime();

    // Найдём разницу в миллисекундах
    const differenceInMilliseconds = time2 - time1;

    // Преобразуем миллисекунды в дни
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const differenceInDays = Math.floor(differenceInMilliseconds / millisecondsPerDay);

    return differenceInDays;
}

// Новая функция для выбора ближайшего дня с занятиями
function selectClosestDayWithClasses() {
    console.log("selectClosestDayWithClasses");
    const today = new Date();
    let currentDate = today;
    const hours = today.getHours();

    // Получаем день недели (0 - Воскресенье, 1 - Понедельник, ..., 6 - Суббота)
    let currentDayIndex = today.getDay();
    if (currentDayIndex === 0) currentDayIndex = 6; // Преобразуем воскресенье в 6
    else currentDayIndex -= 1; // Остальные дни сдвигаем на -1 (Понедельник = 0, ..., Суббота = 5)

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekKeys = Object.keys(schedule);
    const [day, month, year] = weekKeys[0].split('.').map(Number);
    beginingDate = new Date(year, month - 1, day);
    currentWeek = Math.floor((getDaysDifference(beginingDate, currentDate)) / 7)
    console.log("Begin", currentWeek, daysOfWeek[currentDayIndex], currentDayIndex);

    dayIndex = currentDayIndex;
    i = 0;
    for (let weekOffset = 0; weekOffset < weekKeys.length; weekOffset++) {
        const weekIndex = currentWeek + weekOffset;
        const weekDate = weekKeys[weekIndex];
        
        for (; dayIndex < 7; dayIndex++) {
            const checkDay = daysOfWeek[dayIndex];

            console.log("Checking", weekIndex, weekDate, checkDay);

            if (schedule[weekDate] && schedule[weekDate][checkDay] && schedule[weekDate][checkDay].length > 0) {
                currentWeek = weekIndex;
                currentDay = checkDay;
                if (hours > 15 && i == 0) {
                    currentDay = daysOfWeek[dayIndex + 1]
                }
                console.log("Found closest day with classes", currentWeek, currentDay);
                setDisplayMode('list'); // Перемещаем сюда установку начального режима отображения
                return;
            }
        }
        dayIndex = 0
        i++
    }

    // Если ничего не вышло
    currentWeek = 0; // По умолчанию загружаем первую неделю
    currentDay = 'monday'; // Задаем начальный день недели
    setDisplayMode('list'); // Перемещаем сюда установку начального режима отображения
}

// Функция для отображения текущего семестра в пользовательском интерфейсе
function updateSemesterSelector(data) {
    const selector = document.getElementById('semester-selector');
    selector.innerHTML = ''; // Очистка текущих опций

    const semesters = Object.keys(data);
    semesters.forEach(semester => {
        const option = document.createElement('option');
        option.value = semester;
        option.textContent = semester.replace('_', ' ').replace('semester', 'семестр');
        if (semester === currentSemester) {
            option.selected = true; // Устанавливаем последний семестр как выбранный
        }
        selector.appendChild(option);
    });
}

// Функция для отображения расписания выбранного дня и недели
function loadDaySchedule(day, week) {
    console.log("loadDaySchedule", { day, week });
    currentDay = day; // Обновляем текущий выбранный день
    const scheduleContent = document.getElementById('schedule-content');
    const weekDates = Object.keys(schedule); // Получаем даты начала недели из загруженного расписания
    if (weekDates.length > week) {
        const weekDate = weekDates[week]; // Получаем дату недели из ключей объекта расписания
        const daySchedule = schedule[weekDate][day] || [];

        scheduleContent.innerHTML = `<h2>Расписание на ${daysTranslation[day]}:</h2>`;

        if (!daySchedule.length) {
            scheduleContent.innerHTML += '<p>На этот день занятий нет.</p>';
        } else {
            if (displayMode === 'list') {
                renderAsList(scheduleContent, daySchedule);
            } else if (displayMode === 'table') {
                renderAsTable(scheduleContent, daySchedule);
            }
        }

        updateActiveDay();
        updateActiveWeek();
    } else {
        console.log("Неделя вне допустимого диапазона");
        scheduleContent.innerHTML = `<h2>Информация о расписании недоступна для выбранной недели.</h2>`;
    }
}

// Функции для отображения в разных форматах
function renderAsList(container, daySchedule) {
    daySchedule.forEach(activity => {
        container.innerHTML += `
            <div class="activity">
                <div>Время: ${activity.time}</div>
                <div>Занятие: ${activity.activity}</div>
                <div>Место: ${activity.location}</div>
                <div>Преподаватель: ${activity.teacher}</div>
            </div>
        `;
    });
}

function renderAsTable(container, daySchedule) {
    const table = document.createElement('table');
    table.className = 'schedule-table'; // Устанавливаем класс для стилизации
    container.appendChild(table);

    const header = table.createTHead();
    const headerRow = header.insertRow();
    const headings = ['Время', 'Занятие', 'Место', 'Преподаватель'];
    headings.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    daySchedule.forEach(activity => {
        const row = tbody.insertRow();
        Object.entries(activity).forEach(([key, text], index) => {
            const cell = row.insertCell();
            cell.textContent = text;
            cell.setAttribute('data-label', headings[index] + ': '); // Используйте соответствующий заголовок столбца
        });
    });
}

// Функция для загрузки расписания для выбранной недели
function loadWeekSchedule(week) {
    console.log("loadWeekSchedule");
    currentWeek = week;
    loadDaySchedule(currentDay, currentWeek);
    updateActiveWeek();
}

// Обновление активного дня
function updateActiveDay() {
    document.querySelectorAll('nav ul li button').forEach(button => {
        button.classList.remove('active');
        if (button.textContent === daysTranslation[currentDay]) {
            button.classList.add('active');
        }
    });
}

// Обновление активной недели
function updateActiveWeek() {
    document.querySelectorAll('.week-selector button').forEach((button, index) => {
        button.classList.remove('active');
        if (index === currentWeek) {
            button.classList.add('active');
        }
    });
}

// Загрузка расписания и установка начального режима отображения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log("начало");
    loadSchedule();
    console.log("конец");
});
