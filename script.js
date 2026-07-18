// Тема
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// AOS
AOS.init({ duration: 800, once: true, offset: 20 });

// Бургер
document.querySelector('.burger').addEventListener('click', function() {
    const nav = document.querySelector('.nav');
    nav.classList.toggle('active');
    this.setAttribute('aria-expanded', nav.classList.contains('active'));
});
document.querySelectorAll('.nav__list a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.nav').classList.remove('active');
        document.querySelector('.burger').setAttribute('aria-expanded', 'false');
    });
});

// Статистика
const statNumbers = document.querySelectorAll('.stat__number[data-count]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-count'), 10);
            let current = 0;
            const step = Math.ceil(target / 60);
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    el.textContent = target;
                    clearInterval(timer);
                } else {
                    el.textContent = current;
                }
            }, 20);
            observer.unobserve(el);
        }
    });
}, { threshold: 0.5 });
statNumbers.forEach(el => observer.observe(el));

// Видео-карусель
new Swiper('.videoSwiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
    },
    loop: true,
    autoplay: { delay: 5000, disableOnInteraction: true },
});

// Кнопки "Выбрать" в прайс-листе
document.querySelectorAll('.btn--select').forEach(btn => {
    btn.addEventListener('click', function() {
        const serviceName = this.getAttribute('data-service');
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            const serviceSelect = document.getElementById('service');
            for (let opt of serviceSelect.options) {
                if (opt.text === serviceName || opt.value === serviceName) {
                    serviceSelect.value = opt.value;
                    break;
                }
            }
        }, 300);
    });
});

// Форма записи
(function() {
    const form = document.getElementById('bookingForm');
    const timeSelect = document.getElementById('time');
    const dateInput = document.getElementById('date');
    const msgDiv = document.getElementById('formMessage');

    // ⚠️ ЗАМЕНИТЕ НА ВАШ URL
    const SCRIPT_URL = 'https://script.google.com/macros/s/ВАШ_ID/exec';

    async function checkAvailability(date, time, doctor) {
        try {
            const url = SCRIPT_URL + '?date=' + encodeURIComponent(date) +
                        '&time=' + encodeURIComponent(time) +
                        '&doctor=' + encodeURIComponent(doctor);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) return false;
            const result = await response.json();
            if (!result.success) return false;
            return result.bookings.some(b => b.date === date && b.time === time && b.doctor === doctor);
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    function generateTimeSlots() {
        const slots = [];
        for (let h = 9; h <= 17; h++) slots.push(String(h).padStart(2, '0') + ':00');
        return slots;
    }

    function populateTimeSlots(selectedDate, selectedDoctor) {
        const slots = generateTimeSlots();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const selected = new Date(selectedDate + 'T00:00:00');

        timeSelect.innerHTML = '<option value="">' + (translations[currentLang]?.select_time || 'Выберите время') + '</option>';
        slots.forEach(time => {
            if (selected.getTime() === today.getTime()) {
                const [h] = time.split(':').map(Number);
                if (h < now.getHours() || (h === now.getHours() && now.getMinutes() > 0)) return;
            }
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }

    dateInput.addEventListener('change', function() {
        const doctor = document.getElementById('doctor').value;
        if (this.value && doctor) populateTimeSlots(this.value, doctor);
        else timeSelect.innerHTML = '<option value="">' + (translations[currentLang]?.select_time || 'Выберите время') + '</option>';
    });

    document.getElementById('doctor').addEventListener('change', function() {
        const date = dateInput.value;
        if (date && this.value) populateTimeSlots(date, this.value);
        else timeSelect.innerHTML = '<option value="">' + (translations[currentLang]?.select_time || 'Выберите время') + '</option>';
    });

    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', todayStr);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const lastName = document.getElementById('lastName').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const doctor = document.getElementById('doctor').value;
        const service = document.getElementById('service').value;
        const date = dateInput.value;
        const time = timeSelect.value;
        const comment = document.getElementById('comment').value.trim();

        if (!lastName || !firstName || !phone || !doctor || !service || !date || !time) {
            msgDiv.className = 'form-message error';
            msgDiv.textContent = translations[currentLang]?.msg_fill_fields || 'Пожалуйста, заполните все обязательные поля.';
            return;
        }

        const isTaken = await checkAvailability(date, time, doctor);
        if (isTaken) {
            msgDiv.className = 'form-message error';
            msgDiv.textContent = translations[currentLang]?.msg_time_taken || 'Это время уже занято. Пожалуйста, выберите другое время.';
            return;
        }

        let fullPhone = phone;
        if (!phone.startsWith('+996')) fullPhone = '+996' + phone.replace(/^\+?/, '');
        const payload = { lastName, firstName, phone: fullPhone, doctor, service, date, time, comment };

        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            msgDiv.className = 'form-message success';
            msgDiv.textContent = translations[currentLang]?.msg_success || 'Запись успешно создана! Мы свяжемся с вами.';
            document.getElementById('lastName').value = '';
            document.getElementById('firstName').value = '';
            document.getElementById('phone').value = '';
            document.getElementById('service').value = '';
            document.getElementById('comment').value = '';
            if (date && doctor) populateTimeSlots(date, doctor);
        } catch (error) {
            console.error(error);
            msgDiv.className = 'form-message error';
            msgDiv.textContent = translations[currentLang]?.msg_error || 'Ошибка соединения с сервером. Проверьте интернет или попробуйте позже.';
        }
    });
})();
