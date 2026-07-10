let isMuted = false;
let currentDate = new Date();

// Simulasi Waktu Shalat (Bisa dihubungkan ke API eksternal di masa depan)
const prayerTimes = {
    Subuh: "04:35",
    Dzuhur: "12:05",
    Ashar: "15:25",
    Maghrib: "18:15",
    Isya: "19:30"
};

// 1. Sinkronisasi Jam, Gaya Redup Otomatis, & Hitung Mundur
function initClockAndTheme() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('digital-clock').innerText = `${hours}:${minutes}:${seconds}`;

    // Otomatis meredup dari Jam 6 sore (18:00) hingga Jam 5 pagi (05:00)
    const currentHour = now.getHours();
    const body = document.getElementById('body-theme');
    if (currentHour >= 18 || currentHour < 5) {
        body.classList.remove('bg-[#FDFBF7]', 'text-[#2C3E50]');
        body.classList.add('bg-[#121212]', 'text-[#E0E0E0]', 'dark');
    } else {
        body.classList.remove('bg-[#121212]', 'text-[#E0E0E0]', 'dark');
        body.classList.add('bg-[#FDFBF7]', 'text-[#2C3E50]');
    }

    renderPrayerTimesTable();
    updateCountdown(now);
}

// 2. Logika Hitung Mundur Mendekati Waktu Shalat Terdekat
function updateCountdown(now) {
    let nextPrayerName = "Subuh";
    let nextPrayerTimeStr = prayerTimes.Subuh;
    
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    // Cari waktu shalat berikutnya berdasarkan jam saat ini
    if (currentTimeStr < prayerTimes.Subuh) { nextPrayerName = "Subuh"; nextPrayerTimeStr = prayerTimes.Subuh; }
    else if (currentTimeStr < prayerTimes.Dzuhur) { nextPrayerName = "Dzuhur"; nextPrayerTimeStr = prayerTimes.Dzuhur; }
    else if (currentTimeStr < prayerTimes.Ashar) { nextPrayerName = "Ashar"; nextPrayerTimeStr = prayerTimes.Ashar; }
    else if (currentTimeStr < prayerTimes.Maghrib) { nextPrayerName = "Maghrib (Buka Puasa)"; nextPrayerTimeStr = prayerTimes.Maghrib; }
    else if (currentTimeStr < prayerTimes.Isya) { nextPrayerName = "Isya"; nextPrayerTimeStr = prayerTimes.Isya; }
    else { nextPrayerName = "Subuh Besok"; nextPrayerTimeStr = prayerTimes.Subuh; }

    const target = new Date();
    const [tHours, tMinutes] = nextPrayerTimeStr.split(':');
    target.setHours(parseInt(tHours), parseInt(tMinutes), 0);
    
    if (nextPrayerName === "Subuh Besok") {
        target.setDate(target.getDate() + 1);
    }

    let diff = target - now;
    const h = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    document.getElementById('countdown-timer').innerText = `${h}:${m}:${s}`;
    document.getElementById('next-prayer-name').innerText = `Menuju ${nextPrayerName}`;
}

// 3. Tampilkan Durasi Waktu Shalat & Tandai yang Sedang Aktif
function renderPrayerTimesTable() {
    for (const [key, value] of Object.entries(prayerTimes)) {
        document.getElementById(`time-${key}`).innerText = value;
    }
}

// 4. Membuat Mesin Kalender Dinamis dengan Tombol Ganti Bulan
function generateCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    document.getElementById('calendar-month-year').innerText = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const today = new Date();
    document.getElementById('current-date-text').innerText = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Simulasi penanggalan Hijriah sederhana (Rajab 1447 H)
    document.getElementById('hijri-calendar-text').innerText = `Ramadhan / Hijriah 1447 H (Simulasi)`;

    daysContainer.innerHTML = "";
    
    // Mendapatkan hari pertama dalam bulan & jumlah total hari
    const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    // Mengisi ruang kosong tanggal bulan sebelumnya
    for (let x = 0; x < firstDayIndex; x++) {
        const emptyEl = document.createElement('div');
        daysContainer.appendChild(emptyEl);
    }

    // Mengisi angka tanggal asli
    for (let i = 1; i <= totalDays; i++) {
        const dayEl = document.createElement('div');
        dayEl.innerText = i;
        dayEl.className = "p-2 rounded-lg hover:bg-[#D4AF37]/20 cursor-pointer transition";
        
        // Cek jika tanggal yang digambar adalah hari ini
        if (i === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
            dayEl.className = "p-2 bg-[#D4AF37] text-white rounded-lg font-bold shadow-md";
        }
        daysContainer.appendChild(dayEl);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
}

// 5. Audio System (Bypass Web Autoplay)
function testAudio() {
    if (isMuted) return alert("Suara senyap aktif. Hidupkan suara terlebih dahulu!");
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
    alert("Audio Berhasil Terkoneksi!");
}

function toggleMute() {
    isMuted = !isMuted;
    const btn = document.getElementById('mute-btn');
    if (isMuted) {
        btn.innerHTML = `<i class="fa-solid fa-bell-slash"></i> Suara Senyap`;
        btn.className = "px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition";
    } else {
        btn.innerHTML = `<i class="fa-solid fa-bell"></i> Suara Aktif`;
        btn.className = "px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 transition";
    }
}

// Inisialisasi awal sistem
setInterval(initClockAndTheme, 1000);
generateCalendar();
initClockAndTheme();
