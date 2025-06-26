import { initData, getData, setData } from './data.js';

// --- State Management ---
const state = {
    currentUser: null,
    currentView: 'login-view'
};

// --- DOM Elements ---
const views = document.querySelectorAll('.view');
const loginView = document.getElementById('login-view');
const roleButtons = document.querySelectorAll('.role-btn');
const loginForms = document.querySelectorAll('.login-form');
const modal = document.getElementById('edit-modal');
const modalCloseBtn = document.querySelector('.close-btn');
const modalBody = document.getElementById('modal-body');

// --- Navigation ---
function navigateTo(viewId) {
    views.forEach(view => view.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    state.currentView = viewId;
    window.scrollTo(0, 0);
}

// --- Authentication ---
function showLoginForm(role) {
    roleButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.role-btn[data-role="${role}"]`).classList.add('active');

    loginForms.forEach(form => form.style.display = 'none');
    const formToShow = document.getElementById(`${role}-login-form`);
    if (formToShow) {
        formToShow.style.display = 'block';
    }
}

function handleLogin(event, role) {
    event.preventDefault();
    const { users, adminPassword } = getData();
    const form = event.target;
    const errorMsg = form.querySelector('.error-message');
    errorMsg.style.display = 'none';

    let user = null;

    if (role === 'admin') {
        const password = document.getElementById('admin-password').value;
        if (password === adminPassword) {
            user = { role: 'admin', fullName: 'الإدارة' };
        }
    } else {
        const email = document.getElementById(`${role}-email`).value;
        const password = document.getElementById(`${role}-password`).value;
        user = users[role].find(u => u.email === email && u.password === password);
    }

    if (user) {
        state.currentUser = { ...user, role };
        sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        loadDashboard();
    } else {
        errorMsg.textContent = 'بيانات الدخول غير صحيحة.';
        errorMsg.style.display = 'block';
    }
}

function handleLogout() {
    state.currentUser = null;
    sessionStorage.removeItem('currentUser');
    // Hide all login forms and show role selection
    loginForms.forEach(form => form.style.display = 'none');
    roleButtons.forEach(btn => btn.classList.remove('active'));
    navigateTo('login-view');
}

function loadDashboard() {
    if (!state.currentUser) {
        navigateTo('login-view');
        return;
    }

    switch (state.currentUser.role) {
        case 'student':
            renderStudentDashboard();
            navigateTo('student-dashboard-view');
            break;
        case 'teacher':
            renderTeacherDashboard();
            navigateTo('teacher-dashboard-view');
            break;
        case 'admin':
            renderAdminDashboard();
            navigateTo('admin-dashboard-view');
            break;
    }
}

// --- Rendering Functions ---

// STUDENT DASHBOARD
function renderStudentDashboard() {
    const student = state.currentUser;
    // Profile
    const profileContent = `
        <img src="${student.photo || 'user-avatar.png'}" alt="الصورة الشخصية">
        <p><strong>الاسم:</strong> ${student.fullName}</p>
        <p><strong>البريد الإلكتروني:</strong> ${student.email}</p>
        <p><strong>رقم الهوية:</strong> ${student.id}</p>
        <p><strong>الصف:</strong> ${student.class}</p>
        <button id="edit-student-profile-btn" class="edit-btn">تعديل الملف الشخصي</button>
    `;
    document.getElementById('student-profile-content').innerHTML = profileContent;
    document.getElementById('edit-student-profile-btn').addEventListener('click', () => showEditStudentProfileModal(student));

    // Results
    const { results } = getData();
    const studentResult = results.find(r => r.studentId === student.id);
    let resultsContent;
    if (studentResult) {
        resultsContent = `
            <table>
                <thead>
                    <tr><th>المادة</th><th>الدرجة</th></tr>
                </thead>
                <tbody>
                    ${studentResult.grades.map(g => `<tr><td>${g.subject}</td><td>${g.grade}</td></tr>`).join('')}
                </tbody>
                <tfoot>
                    <tr><td><strong>التقدير العام</strong></td><td><strong>${studentResult.overall}</strong></td></tr>
                </tfoot>
            </table>
        `;
    } else {
        resultsContent = '<p>نتيجتك لم تُرفع بعد.</p>';
    }
    document.getElementById('student-results-content').innerHTML = resultsContent;

    // Announcements
    renderAnnouncements('student-announcements-content');
}

// TEACHER DASHBOARD
function renderTeacherDashboard() {
    const teacher = state.currentUser;
    document.getElementById('teacher-welcome').textContent = `مرحباً، ${teacher.fullName}`;

    // Class summary
    const { missedClasses } = getData();
    const teacherMissedClasses = missedClasses.filter(c => c.teacherId === teacher.id);
    const summary = `
      <p><strong>الصفوف المسندة:</strong> ${teacher.classes.join(', ')}</p>
      <p><strong>حصص غير منجزة مسجلة:</strong> ${teacherMissedClasses.length}</p>
    `;
    document.getElementById('teacher-classes-summary').innerHTML = summary;

    // Announcements
    renderAnnouncements('teacher-announcements-content');
}

// ADMIN DASHBOARD
function renderAdminDashboard(activeTab = 'students') {
    const tabs = document.querySelectorAll('.admin-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.admin-dashboard .tab-content');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if(tab.dataset.tab === activeTab) {
            tab.classList.add('active');
        }
    });

    tabContents.forEach(content => {
        content.classList.remove('active');
        if(content.id === `${activeTab}-tab`) {
            content.classList.add('active');
        }
    });

    switch (activeTab) {
        case 'students': renderAdminStudents(); break;
        case 'teachers': renderAdminTeachers(); break;
        case 'results': renderAdminResults(); break;
        case 'announcements': renderAdminAnnouncements(); break;
        case 'missed-classes': renderAdminMissedClasses(); break;
    }
}

// --- SHARED COMPONENTS ---
function renderAnnouncements(containerId) {
    const { announcements } = getData();
    const container = document.getElementById(containerId);
    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<p>لا توجد إعلانات حالياً.</p>';
        return;
    }
    const announcementsHtml = announcements
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(ann => `
            <div class="announcement-item">
                <h3>${ann.title}</h3>
                <p>${ann.content}</p>
                <small>تاريخ النشر: ${new Date(ann.date).toLocaleDateString('ar-EG')}</small>
            </div>
        `).join('');
    container.innerHTML = announcementsHtml;
}


// --- ADMIN SUB-RENDERS ---
function renderAdminStudents() {
    const { users } = getData();
    const container = document.getElementById('admin-students-content');
    container.innerHTML = `
        <div class="admin-list">
            ${users.student.map(s => `
                <div class="admin-list-item">
                    <span>${s.fullName} (ID: ${s.id}) - الصف: ${s.class}</span>
                    <div class="admin-actions">
                        <button class="delete-btn" data-id="${s.id}" data-role="student">حذف</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="admin-form-container">
            <h3>إضافة طالب جديد</h3>
            <form id="add-student-form">
                <input type="text" name="fullName" placeholder="الاسم الكامل" required>
                <input type="email" name="email" placeholder="البريد الإلكتروني" required>
                <input type="password" name="password" placeholder="كلمة المرور" required>
                <input type="text" name="class" placeholder="الصف" required>
                <input type="text" name="photo" placeholder="رابط الصورة (اختياري)">
                <button type="submit">إضافة طالب</button>
            </form>
        </div>
    `;
    // Add event listeners for delete and add
    container.querySelector('#add-student-form').addEventListener('submit', handleAddUser);
    container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteUser));
}

function renderAdminTeachers() {
    const { users } = getData();
    const container = document.getElementById('admin-teachers-content');
    container.innerHTML = `
        <div class="admin-list">
            ${users.teacher.map(t => `
                <div class="admin-list-item">
                    <span>${t.fullName} - الصفوف: ${t.classes.join(', ')}</span>
                    <div class="admin-actions">
                        <button class="delete-btn" data-id="${t.id}" data-role="teacher">حذف</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="admin-form-container">
            <h3>إضافة معلم جديد</h3>
            <form id="add-teacher-form">
                <input type="text" name="fullName" placeholder="الاسم الكامل" required>
                <input type="email" name="email" placeholder="البريد الإلكتروني" required>
                <input type="password" name="password" placeholder="كلمة المرور" required>
                <input type="text" name="classes" placeholder="الصفوف (مفصولة بفاصلة)" required>
                <button type="submit">إضافة معلم</button>
            </form>
        </div>
    `;
    container.querySelector('#add-teacher-form').addEventListener('submit', handleAddUser);
    container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteUser));
}

function renderAdminResults() {
    const { users, results } = getData();
    const container = document.getElementById('admin-results-content');
    container.innerHTML = `
        <div class="admin-list">
            ${results.map(r => {
                const student = users.student.find(s => s.id === r.studentId);
                return `
                <div class="admin-list-item">
                    <span>نتيجة الطالب: ${student ? student.fullName : 'غير معروف'} (ID: ${r.studentId})</span>
                    <div class="admin-actions">
                        <button class="delete-btn" data-id="${r.studentId}" data-type="result">حذف</button>
                    </div>
                </div>
            `}).join('')}
        </div>
        <div class="admin-form-container">
            <h3>رفع/تعديل نتيجة طالب</h3>
            <form id="add-result-form">
                <select name="studentId" required>
                    <option value="">اختر طالباً</option>
                    ${users.student.map(s => `<option value="${s.id}">${s.fullName} (ID: ${s.id})</option>`).join('')}
                </select>
                <textarea name="grades" placeholder="المواد والدرجات بصيغة JSON: [{&quot;subject&quot;:&quot;مادة&quot;, &quot;grade&quot;:100}]" required></textarea>
                <input type="text" name="overall" placeholder="التقدير العام" required>
                <button type="submit">حفظ النتيجة</button>
            </form>
        </div>
    `;
    container.querySelector('#add-result-form').addEventListener('submit', handleAddResult);
    container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteResult));
}

function renderAdminAnnouncements() {
    const { announcements } = getData();
    const container = document.getElementById('admin-announcements-content');
    container.innerHTML = `
        <div class="admin-list">
            ${announcements.map(a => `
                <div class="admin-list-item">
                    <span>${a.title}</span>
                    <div class="admin-actions">
                         <button class="delete-btn" data-id="${a.id}" data-type="announcement">حذف</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="admin-form-container">
            <h3>نشر إعلان جديد</h3>
            <form id="add-announcement-form">
                <input type="text" name="title" placeholder="عنوان الإعلان" required>
                <textarea name="content" placeholder="محتوى الإعلان" required></textarea>
                <button type="submit">نشر</button>
            </form>
        </div>
    `;
    container.querySelector('#add-announcement-form').addEventListener('submit', handleAddAnnouncement);
    container.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteAnnouncement));
}

function renderAdminMissedClasses() {
    const { missedClasses, users } = getData();
    const container = document.getElementById('admin-missed-classes-content');
     container.innerHTML = `
        ${missedClasses.length > 0 ? `
        <table>
            <thead>
                <tr>
                    <th>المعلم</th>
                    <th>المادة</th>
                    <th>الصف</th>
                    <th>التاريخ</th>
                    <th>ملاحظات</th>
                </tr>
            </thead>
            <tbody>
                ${missedClasses.map(c => {
                    const teacher = users.teacher.find(t => t.id === c.teacherId);
                    return `
                    <tr>
                        <td>${teacher ? teacher.fullName : 'غير معروف'}</td>
                        <td>${c.subject}</td>
                        <td>${c.class}</td>
                        <td>${new Date(c.date).toLocaleDateString('ar-EG')}</td>
                        <td>${c.notes || 'لا يوجد'}</td>
                    </tr>
                `}).join('')}
            </tbody>
        </table>
        ` : '<p>لا توجد حصص غير منجزة مسجلة.</p>'}
    `;
}

// --- MODAL & EDITING LOGIC ---
function showEditStudentProfileModal(student) {
    modalBody.innerHTML = `
        <h2>تعديل الملف الشخصي</h2>
        <form id="edit-student-form">
            <label for="edit-fullName">الاسم الكامل:</label>
            <input type="text" id="edit-fullName" value="${student.fullName}" required>
            <label for="edit-photo">رابط الصورة:</label>
            <input type="text" id="edit-photo" value="${student.photo || ''}">
            <label for="edit-password">كلمة مرور جديدة (اتركه فارغاً لعدم التغيير):</label>
            <input type="password" id="edit-password">
            <button type="submit" class="save-btn">حفظ التغييرات</button>
        </form>
    `;
    modal.style.display = 'block';

    document.getElementById('edit-student-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = getData();
        const studentIndex = data.users.student.findIndex(s => s.id === student.id);

        if (studentIndex !== -1) {
            data.users.student[studentIndex].fullName = document.getElementById('edit-fullName').value;
            data.users.student[studentIndex].photo = document.getElementById('edit-photo').value;
            const newPassword = document.getElementById('edit-password').value;
            if (newPassword) {
                data.users.student[studentIndex].password = newPassword;
            }
            setData(data);
            state.currentUser = data.users.student[studentIndex]; // Update current user in state
            sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            closeModal();
            renderStudentDashboard();
        }
    });
}


function closeModal() {
    modal.style.display = 'none';
    modalBody.innerHTML = '';
}


// --- DATA HANDLERS (Create, Delete) ---
function handleAddUser(event) {
    event.preventDefault();
    const form = event.target;
    const role = form.id === 'add-student-form' ? 'student' : 'teacher';
    const data = getData();
    
    const newUser = {
        id: `${role}-${Date.now()}`,
        fullName: form.elements.fullName.value,
        email: form.elements.email.value,
        password: form.elements.password.value,
    };
    
    if (role === 'student') {
        newUser.class = form.elements.class.value;
        newUser.photo = form.elements.photo.value || 'user-avatar.png';
    } else {
        newUser.classes = form.elements.classes.value.split(',').map(c => c.trim());
    }
    
    data.users[role].push(newUser);
    setData(data);
    renderAdminDashboard(role + 's');
}

function handleDeleteUser(event) {
    const { id, role } = event.target.dataset;
    if (confirm(`هل أنت متأكد من حذف هذا ${role === 'student' ? 'الطالب' : 'المعلم'}؟`)) {
        const data = getData();
        data.users[role] = data.users[role].filter(u => u.id !== id);
        // Also remove related data like results
        if (role === 'student') {
            data.results = data.results.filter(r => r.studentId !== id);
        }
        setData(data);
        renderAdminDashboard(role + 's');
    }
}

function handleAddResult(event) {
    event.preventDefault();
    const form = event.target;
    const studentId = form.elements.studentId.value;
    const overall = form.elements.overall.value;
    let grades;
    try {
        grades = JSON.parse(form.elements.grades.value);
    } catch (e) {
        alert("صيغة JSON للدرجات غير صحيحة.");
        return;
    }

    const data = getData();
    const resultIndex = data.results.findIndex(r => r.studentId === studentId);
    if(resultIndex !== -1) { // update existing
        data.results[resultIndex] = { studentId, grades, overall };
    } else { // add new
        data.results.push({ studentId, grades, overall });
    }
    setData(data);
    renderAdminDashboard('results');
}

function handleDeleteResult(event) {
    const { id } = event.target.dataset;
     if (confirm(`هل أنت متأكد من حذف نتيجة هذا الطالب؟`)) {
        const data = getData();
        data.results = data.results.filter(r => r.studentId !== id);
        setData(data);
        renderAdminDashboard('results');
    }
}

function handleAddAnnouncement(event) {
    event.preventDefault();
    const form = event.target;
    const newAnnouncement = {
        id: `ann-${Date.now()}`,
        title: form.elements.title.value,
        content: form.elements.content.value,
        date: new Date().toISOString()
    };
    const data = getData();
    data.announcements.push(newAnnouncement);
    setData(data);
    renderAdminDashboard('announcements');
}

function handleDeleteAnnouncement(event) {
    const { id } = event.target.dataset;
    if (confirm(`هل أنت متأكد من حذف هذا الإعلان؟`)) {
        const data = getData();
        data.announcements = data.announcements.filter(a => a.id !== id);
        setData(data);
        renderAdminDashboard('announcements');
    }
}

function handleMissedClassSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = getData();
    const newMissedClass = {
        id: `mc-${Date.now()}`,
        teacherId: state.currentUser.id,
        subject: form.elements['missed-subject'].value,
        date: form.elements['missed-date'].value,
        class: form.elements['missed-class'].value,
        notes: form.elements['missed-notes'].value,
    };
    data.missedClasses.push(newMissedClass);
    setData(data);
    
    form.reset();
    const successMsg = document.getElementById('missed-class-success');
    successMsg.style.display = 'block';
    setTimeout(() => successMsg.style.display = 'none', 3000);
    renderTeacherDashboard(); // Re-render to update summary
}

// --- Initializer ---
function init() {
    // Initialize data in localStorage if not present
    initData();

    // Event Listeners
    roleButtons.forEach(button => {
        button.addEventListener('click', () => showLoginForm(button.dataset.role));
    });

    document.getElementById('student-login-form').addEventListener('submit', (e) => handleLogin(e, 'student'));
    document.getElementById('teacher-login-form').addEventListener('submit', (e) => handleLogin(e, 'teacher'));
    document.getElementById('admin-login-form').addEventListener('submit', (e) => handleLogin(e, 'admin'));
    
    document.getElementById('student-logout-btn').addEventListener('click', handleLogout);
    document.getElementById('teacher-logout-btn').addEventListener('click', handleLogout);
    document.getElementById('admin-logout-btn').addEventListener('click', handleLogout);

    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => renderAdminDashboard(btn.dataset.tab));
    });
    
    document.getElementById('missed-class-form').addEventListener('submit', handleMissedClassSubmit);

    modalCloseBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    // Check for logged-in user on page load
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
        loadDashboard();
    } else {
        navigateTo('login-view');
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

