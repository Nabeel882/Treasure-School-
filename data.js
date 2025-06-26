const DB_KEY = 'schoolManagementData';

const initialData = {
    users: {
        student: [
            { id: 'student-1', fullName: 'أحمد محمود', email: 'ahmed@example.com', password: '123', class: 'الصف العاشر', photo: 'user-avatar.png' },
            { id: 'student-2', fullName: 'فاطمة الزهراء', email: 'fatima@example.com', password: '123', class: 'الصف الحادي عشر', photo: 'user-avatar.png' }
        ],
        teacher: [
            { id: 'teacher-1', fullName: 'أستاذ خالد', email: 'khaled@example.com', password: '456', classes: ['الصف العاشر', 'الصف الحادي عشر'] },
            { id: 'teacher-2', fullName: 'أستاذة منى', email: 'mona@example.com', password: '456', classes: ['الصف الثاني عشر'] }
        ]
    },
    adminPassword: '090941',
    results: [
        { 
            studentId: 'student-1', 
            grades: [
                { subject: 'الرياضيات', grade: 85 },
                { subject: 'الفيزياء', grade: 92 },
                { subject: 'العربية', grade: 88 }
            ],
            overall: 'جيد جداً'
        }
    ],
    announcements: [
        {
            id: 'ann-1',
            title: 'إعلان بداية إجازة منتصف العام',
            content: 'تبدأ إجازة منتصف العام الدراسي يوم الأحد القادم. نتمنى لكم إجازة سعيدة!',
            date: '2024-05-20T10:00:00Z'
        },
        {
            id: 'ann-2',
            title: 'تنبيه بشأن مواعيد الامتحانات النهائية',
            content: 'يرجى مراجعة جدول الامتحانات النهائية الذي تم نشره على لوحة الإعلانات الرئيسية في المدرسة.',
            date: '2024-05-15T12:30:00Z'
        }
    ],
    missedClasses: [
        {
            id: 'mc-1',
            teacherId: 'teacher-2',
            subject: 'الكيمياء',
            date: '2024-05-18',
            class: 'الصف الثاني عشر',
            notes: 'غياب بسبب ظرف طارئ'
        }
    ]
};

export function initData() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(initialData));
    }
}

export function getData() {
    return JSON.parse(localStorage.getItem(DB_KEY));
}

export function setData(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

