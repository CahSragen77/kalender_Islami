let isMuted = false;
let currentDate = new Date();
let prayerTimes = {}; // Tempat menampung data waktu shalat dari API

// 1. Inisialisasi Jam Digital & Sistem Redup Otomatis
function initClockAndTheme() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('digital-clock').innerText = `${hours}:${minutes}:${seconds}`;

    // Otomatis meredup dari Jam 18:00 sore hingga Jam 05:00 pagi
    const currentHour = now.getHours();
    const body = document.getElementById('body-theme');
    if (currentHour >= 18 || currentHour < 5) {
        body.classList.remove('bg-[#FDFBF7]', 'text-[#2C3E50]');
        body.classList.add('bg-[#121212]', 'text-[#E0E0E0]', 'dark');
    } else {
        body.classList.remove('bg-[#121212]', 'text-[#E0E0E0]', 'dark');
        body.classList.add('bg-[#FDFBF7]', 'text-[#2C3E50]');
    }

    if (Object.keys(prayerTimes).length > 0) {
        updateCountdown(now);
    }
}

// 2. Mengambil Data Waktu Shalat & Hijriah dari Aladhan API Berdasarkan Lokasi GPS
function fetchPrayerTimesAndHijri() {
    if (navigator.geolocation) {
        // Meminta izin lokasi otomatis dari browser pengguna
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                const timestamp = Math.floor(Date.now() / 1000);
                
                // Panggil API Aladhan dengan metode kalkulasi Kemenag RI / MABIMS (Metode ID: 11 atau otomatis berdasarkan koordinat)
                const apiUrl = `https://aladhan.com{timestamp}?latitude=${latitude}&longitude=${longitude}&method=11`;
                
                fetch(apiUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data.code === 200) {
                            const timings = data.data.timings;
                            // Ambil waktu shalat utama saja
                            prayerTimes = {
                                Subuh: timings.Fajr,
                                Dzuhur: timings.Dhuhr,
                                Ashar: timings.Asr,
                                Maghrib: timings.Maghrib,
                                Isya: timings.Isha,
                                Imsak: timings.Imsak
                            };
                            
                            // Perbarui Teks Kalender Hijriah Asli dari API
                            const hijri = data.data.date.hijri;
                            document.getElementById('hijri-calendar-text').innerText = `${hijri.day} ${hijri.month.id} ${hijri.year} H`;
                            
                            renderPrayerTimesTable();
                        }
                    })
                    .catch(error => console.error("Gagal mengambil data API:", error));
            },
            (error) => {
                // Jika pengguna menolak izin lokasi, gunakan koordinat default (Jakarta sebagai cadangan)
                console.warn("Izin lokasi ditolak, menggunakan lokasi cadangan (Jakarta).");
                fetchFallbackPrayerTimes();
            }
        );
    } else {
        fetchFallbackPrayerTimes();
    }
}

// Fungsi Cadangan Jika GPS Dimatikan Pengguna (Default: Jakarta)
function fetchFallbackPrayerTimes() {
    const timestamp = Math.floor(Date.now() / 1000);
    const fallbackUrl = `https://aladhan.com{timestamp}?latitude=-6.2088&longitude=106.8456&method=11`;
    
    fetch(fallbackUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                const timings = data.data.timings;
                prayerTimes = {
                    Subuh: timings.Fajr,
                    Dzuhur: timings.Dhuhr,
                    Ashar: timings.Asr,
                    Maghrib: timings.Maghrib,
                    Isya: timings.Isha,
                    Imsak: timings.Imsak
                };
                const hijri = data.data.date.hijri;
                document.getElementById('hijri-calendar-text').innerText = `${hijri.day} ${hijri.month.id} ${hijri.year} H`;
                renderPrayerTimesTable();
            }
        });
}

// 3. Logika Hitung Mundur Mendekati Waktu Shalat/Imsak/Berbuka Asli
function updateCountdown(now) {
    let nextPrayerName = "Subuh";
    let nextPrayerTimeStr = prayerTimes.Subuh;
    
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    // Reset status highlight di tabel UI
    resetPrayerHighlights();

    // Tentukan waktu shalat terdekat berikutnya
    if (currentTimeStr < prayerTimes.Imsak) { nextPrayerName = "Imsak"; nextPrayerTimeStr = prayerTimes.Imsak; highlightActivePrayer('Subuh'); }
    else if (currentTimeStr < prayerTimes.Subuh) { nextPrayerName = "Subuh"; nextPrayerTimeStr = prayerTimes.Subuh; highlightActivePrayer('Subuh'); }
    else if (currentTimeStr < prayerTimes.Dzuhur) { nextPrayerName = "Dzuhur"; nextPrayerTimeStr = prayerTimes.Dzuhur; highlightActivePrayer('Dzuhur'); }
    else if (currentTimeStr < prayerTimes.Ashar) { nextPrayerName = "Ashar"; nextPrayerTimeStr = prayerTimes.Ashar; highlightActivePrayer('Ashar'); }
    else if (currentTimeStr < prayerTimes.Maghrib) { nextPrayerName = "Maghrib (Buka Puasa)"; nextPrayerTimeStr = prayerTimes.Maghrib; highlightActivePrayer('Maghrib'); }
    else if (currentTimeStr < prayerTimes.Isya) { nextPrayerName = "Isya"; nextPrayerTimeStr = prayerTimes.Isya; highlightActivePrayer('Isya'); }
    else { nextPrayerName = "Subuh Besok"; nextPrayerTimeStr = prayerTimes.Subuh; }

    const target = new Date();
    const [tHours, tMinutes] = nextPrayerTimeStr.split(':');
    target.setHours(parseInt(tHours), parseInt(tMinutes), 0);
    
    if (nextPrayerName === "Subuh Besok") {
        target.setDate(target.getDate() + 1);
    }

    let diff = target - now;
    
    // Cek Pemicu Alarm Tepat Waktu (Detik ke-00 pada menit shalat)
    if (Math.floor(diff / 1000) === 0) {
        triggerAlarmNotification(nextPrayerName);
    }

    const h = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

    document.getElementById('countdown-timer').innerText = `${h}:${m}:${s}`;
    document.getElementById('next-prayer-name').innerText = `Menuju ${nextPrayerName}`;
}

// 4. Perbarui Tampilan Angka di UI Jadwal Shalat
function renderPrayerTimesTable() {
    for (const [key, value] of Object.entries(prayerTimes)) {
        const element = document.getElementById(`time-${key}`);
        if (element) element.innerText = value;
    }
}

function highlightActivePrayer(prayerId) {
    const el = document.getElementById(`p-${prayerId}`);
    if (el) el.classList.add('active-prayer');
}

function resetPrayerHighlights() {
    ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].forEach(id => {
        const el = document.getElementById(`p-${id}`);
        if (el) el.classList.remove('active-prayer');
    });
}

// 5. Otomatisasi Generator Kalender Masehi
function generateCalendar() {
    const daysContainer = document.getElementById('calendar-days');
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    document.getElementById('calendar-month-year').innerText = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    const today = new Date();
    document.getElementById('current-date-text').innerText = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    daysContainer.innerHTML = "";
    
    const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    for (let x = 0; x < firstDayIndex; x++) {
        const emptyEl = document.createElement('div');
        daysContainer.appendChild(emptyEl);
    }

    for (let i = 1; i <= totalDays; i++) {
        const dayEl = document.createElement('div');
        dayEl.innerText = i;
        dayEl.className = "p-2 rounded-lg hover:bg-[#D4AF37]/20 cursor-pointer transition";
        
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

// 6. Sistem Audio & Detektor Alarm Bunyi Real-time
function triggerAlarmNotification(prayerName) {
    if (isMuted) return;
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    let count = 0;
    const interval = setInterval(() => {
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
        
        count++;
        if (count >= 3) clearInterval(interval);
    }, 1000);

    alert(`⚠️ Waktu ${prayerName} telah tiba!`);
}

function testAudio() {
    if (isMuted) return alert("Suara senyap aktif. Hidupkan suara terlebih dahulu!");
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
    alert("Koneksi API & Audio Berhasil Terhubung!");
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

// Jalankan seluruh fungsi utama saat halaman dimuat
setInterval(initClockAndTheme, 1000);
generateCalendar();
fetchPrayerTimesAndHijri();
initClockAndTheme();
