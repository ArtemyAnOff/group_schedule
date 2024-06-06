let displayMode = 'list'; // По умолчанию режим отображения - список
let loadedData = null; // Данные, загруженные из JSON

// Функция для изменения режима отображения
function setDisplayMode(mode) {
    displayMode = mode;
    updateDisplayModeButtons();
    displayExamsAndCredits(loadedData);
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

function switchSemester(semester) {
    currentSemester = semester;
    loadExamsAndCredits(); // Перезагружает расписание с учётом выбранного семестра
}

let currentSemester; // Удаляем начальное значение

// Функция для загрузки данных из JSON-файла
function loadExamsAndCredits() {
    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            // Определение и установка самого последнего семестра перед обновлением селектора
            if (!currentSemester) {
                const semesters = Object.keys(data);
                currentSemester = semesters[semesters.length - 1]; // Последний семестр становится текущим
            }

            updateSemesterSelector(data); // Обновляем селектор с семестрами

            loadedData = data[currentSemester]; // Сохраняем загруженные данные
            displayExamsAndCredits(loadedData);
        })
        .catch(error => console.error('Ошибка при загрузке расписания:', error));
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

// Основная функция для отображения экзаменов и зачетов
function displayExamsAndCredits(data) {
    if (!data) return;

    const exams = [];
    const credits = [];
    const gradedCredits = [];
    const courseworks = data.courseworks || [];

    Object.keys(data).forEach((mondayDate, index) => {
        if (mondayDate === 'courseworks') return; // Пропускаем курсовые работы
        const weekNumber = `Неделя ${index + 1}`;
        const daySchedules = data[mondayDate];

        for (const day in daySchedules) {
            daySchedules[day].forEach(activity => {
                const dateOfExam = getDateOfExam(mondayDate, day);
                const cleanActivityName = activity.activity.split('_')[0];
                const item = { ...activity, activity: cleanActivityName, date: dateOfExam, weekNumber, day };

                if (activity.activity.includes('ЭКЗ')) exams.push(item);
                if (activity.activity.includes('ЗАЧ') && !activity.activity.includes('ЗаО')) credits.push(item);
                if (activity.activity.includes('ЗаО')) gradedCredits.push(item);
            });
        }
    });

    renderExamsAndCredits(exams, credits, gradedCredits, courseworks);
}

function renderExamsAndCredits(exams, credits, gradedCredits, courseworks) {
    const container = document.getElementById('exam-content');
    container.innerHTML = '';

    if (displayMode === 'list') {
        addItemsToPage('Экзамены', exams, container, false);
        addItemsToPage('Зачеты с оценкой', gradedCredits, container, false);
        addItemsToPage('Зачеты', credits, container, false);
        addItemsToPage('Курсовые работы', courseworks.map(cw => ({
            activity: cw.title,
            subject: cw.subject,
            deadline: cw.deadline,
            time: '',
            location: '',
            teacher: cw.teacher
        })), container, true); // Добавляем курсовые работы
    } else {
        renderAsCalendar(exams, credits, gradedCredits, courseworks, container);
    }
}

// Функция для отображения экзаменов и зачетов в виде календаря
function renderAsCalendar(exams, credits, gradedCredits, courseworks, container) {
    const table = document.createElement('table');
    table.className = 'exam-calendar';

    // Создаем заголовки для недель и дней
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const th = document.createElement('th'); // Пустая ячейка для сетки
    th.textContent = 'День \\ Неделя';
    headerRow.appendChild(th);

    for (let week = 1; week <= 3; week++) {
        const th = document.createElement('th');
        th.textContent = `Неделя ${week}`;
        headerRow.appendChild(th);
    }

    const tbody = table.createTBody();
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    daysOfWeek.forEach((day, dayIndex) => {
        const row = tbody.insertRow();
        const dayCell = row.insertCell();
        dayCell.textContent = day;

        for (let week = 1; week <= 3; week++) {
            const cell = row.insertCell();

            // Экзамены
            const dayExams = exams.filter(exam => exam.weekNumber === `Неделя ${week}` && dayOfWeek(exam.date) === dayIndex);
            dayExams.forEach(exam => {
                const div = document.createElement('div');
                div.className = 'exam';
                div.textContent = exam.activity + ' (Экзамен)';
                cell.appendChild(div);
            });

            // Зачёты
            const dayCredits = credits.filter(credit => credit.weekNumber === `Неделя ${week}` && dayOfWeek(credit.date) === dayIndex);
            dayCredits.forEach(credit => {
                const div = document.createElement('div');
                div.className = 'credit';
                div.textContent = credit.activity + ' (Зачёт)';
                cell.appendChild(div);
            });

            // Зачёты с оценкой
            const dayGradedCredits = gradedCredits.filter(credit => credit.weekNumber === `Неделя ${week}` && dayOfWeek(credit.date) === dayIndex);
            dayGradedCredits.forEach(credit => {
                const div = document.createElement('div');
                div.className = 'graded-credit';
                div.textContent = credit.activity + ' (Зачёт с оценкой)';
                cell.appendChild(div);
            });

            // Курсовые работы
            const weekStartDate = getWeekStartDate(week); // Получаем дату начала недели
            const dayCourseworks = courseworks.filter(cw => isSameDay(cw.deadline, weekStartDate, dayIndex));
            dayCourseworks.forEach(cw => {
                const div = document.createElement('div');
                div.className = 'coursework';
                div.textContent = `${cw.title} - ${cw.subject} (Курсовая)`;
                cell.appendChild(div);
            });
        }
    });

    container.appendChild(table);
}

// Проверка, является ли дата дедлайна курсовой работы тем же днем недели
function isSameDay(deadline, weekStartDate, dayIndex) {
    const deadlineDate = new Date(deadline.split('.').reverse().join('-'));
    const comparisonDate = new Date(weekStartDate);
    comparisonDate.setDate(weekStartDate.getDate() + dayIndex);
    return deadlineDate.toDateString() === comparisonDate.toDateString();
}

// Получение даты начала недели
function getWeekStartDate(week) {
    const mondayDate = Object.keys(loadedData)[week - 1];
    const [day, month, year] = mondayDate.split('.').map(num => parseInt(num, 10));
    return new Date(year, month - 1, day);
}

// Функция для определения дня недели по дате
function dayOfWeek(dateStr) {
    const [day, month, year] = dateStr.split('.').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0 ? 6 : date.getDay() - 1; // Возвращаем день недели (0 - Пн, 1 - Вт, ..., 5 - Сб, 6 - Вс)
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

// Функция для добавления данных на страницу
function addItemsToPage(title, items, container, isCoursework) {
    const section = document.createElement('section');
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = title;
    section.appendChild(sectionTitle);

    const list = document.createElement('ul');
    list.className = 'exam-list';
    items.forEach(item => {
        const listItem = document.createElement('li');

        const listItemContent = document.createElement('div');
        listItemContent.className = 'list-item-content';

        const span = document.createElement('span');
        if (isCoursework) {
            span.textContent = `${item.activity} - ${item.subject} - ${item.deadline} - ${item.teacher}`;
        } else {
            span.textContent = `${item.activity} - ${item.weekNumber} - ${daysTranslation[item.day]} - ${item.date} - ${item.teacher}`;
        }

        const passedWrapper = document.createElement('div');
        passedWrapper.className = 'passed-wrapper';

        const uniqueId = isCoursework ? `${item.activity}-${item.subject}-${item.deadline}` : `${item.date}-${item.time}`;

        const completedCheckbox = document.createElement('input');
        completedCheckbox.type = 'checkbox';
        completedCheckbox.className = 'completed';
        completedCheckbox.id = `completed-${uniqueId}`;
        completedCheckbox.checked = loadCheckboxState(completedCheckbox.id);
        completedCheckbox.addEventListener('change', () => {
            saveCheckboxState(completedCheckbox.id, completedCheckbox.checked);
        });

        const passedCheckbox = document.createElement('input');
        passedCheckbox.type = 'checkbox';
        passedCheckbox.className = 'passed';
        passedCheckbox.id = `passed-${uniqueId}`;
        passedCheckbox.checked = loadCheckboxState(passedCheckbox.id);
        passedCheckbox.addEventListener('change', () => {
            saveCheckboxState(passedCheckbox.id, passedCheckbox.checked);
        });

        passedWrapper.appendChild(completedCheckbox);
        passedWrapper.appendChild(passedCheckbox);

        listItemContent.appendChild(span);
        listItem.appendChild(listItemContent);
        listItem.appendChild(passedWrapper);
        list.appendChild(listItem);
    });

    section.appendChild(list);
    container.appendChild(section);
}

// Сохраняет состояние чекбоксов в localStorage
function saveCheckboxState(id, state) {
    localStorage.setItem(id, state);
}

// Загружает состояние чекбоксов из localStorage
function loadCheckboxState(id) {
    return localStorage.getItem(id) === 'true';
}

// Получение состояния чекбокса из LocalStorage
function getCheckboxState(item, type) {
    const key = `${item.activity}-${item.date}-${type}`;
    return localStorage.getItem(key) === 'true';
}

// Сохранение состояния чекбокса в LocalStorage
function setCheckboxState(item, type, state) {
    const key = `${item.activity}-${item.date}-${type}`;
    localStorage.setItem(key, state);
}

function getDateOfExam(mondayDate, dayOfWeek) {
    const [day, month, year] = mondayDate.split('.').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);
    const dayOffset = { 'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6 }[dayOfWeek];
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('ru-RU'); // Формат dd.mm.yyyy
}

// Загрузка расписания и установка начального режима отображения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadExamsAndCredits();
    setDisplayMode('list');
});
