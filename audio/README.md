Cara menambahkan audio suara perempuan Bahasa Indonesia

Tujuan
- Sediakan file audio rekaman suara perempuan beraksen Bahasa Indonesia untuk:
  - instruksi/prompt (contoh: "Pilih binatang kucing")
  - umpan balik benar (contoh: "Benar! Bagus sekali")
  - umpan balik salah (contoh: "Salah, coba lagi")

Format yang direkomendasikan
- Format: MP3 atau WAV (browser modern mendukung keduanya)
- Bitrate: 64-128 kbps cukup
- Nama file: gunakan nama yang mudah dikenali (opsional, karena UI memungkinkan unggah file manual)

Cara membuat file suara
- Opsi cepat: gunakan layanan TTS yang mendukung Bahasa Indonesia (contoh: Google Cloud TTS, Amazon Polly, atau layanan TTS online) dan pilih suara wanita/wanita Indonesia. Simpan hasilnya sebagai MP3.
- Opsi rekaman sendiri: rekam menggunakan microphone, simpan sebagai WAV/MP3. Pastikan lingkungan tenang.

Cara menggunakan di aplikasi
- Buka halaman "Main" di aplikasi.
- Di bagian "Unggah audio suara wanita (opsional)" pilih file untuk:
  - instruksi (pertanyaan/prompt)
  - correct (umpan balik benar)
  - wrong (umpan balik salah)
- Setelah diunggah, aplikasi akan memutar file yang diunggah saat diperlukan. Jika file tidak diunggah, aplikasi tetap menggunakan SpeechSynthesis (TTS) Bahasa Indonesia.

Lisensi & hak suara
- Pastikan Anda memiliki hak untuk menggunakan suara yang Anda unggah (rekaman sendiri atau lisensi dari penyedia TTS).

Catatan teknis
- File disimpan sebagai `Blob` URL di sesi browser, tidak dikirim ke server.
- Untuk produksi, Anda mungkin ingin menempatkan file audio di folder `audio/` dan memodifikasi aplikasi agar memuat file secara statis.
