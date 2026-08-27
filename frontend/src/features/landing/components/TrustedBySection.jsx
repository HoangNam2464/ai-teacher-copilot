import React from 'react';

export function TrustedBySection() {
  const stats = [
    { value: '1,200+', label: 'Giáo viên K-12 tin dùng' },
    { value: '100%', label: 'Bám sát khung Công Văn 5512' },
    { value: '70%', label: 'Giảm thời gian soạn học liệu' },
    { value: '63/63', label: 'Tỉnh thành trên toàn quốc' },
  ];

  return (
    <section className="trusted-by-section">
      <div className="trusted-by-container">
        <p className="trusted-by-title">Được phát triển và đồng hành cùng cộng đồng giáo viên Việt Nam</p>
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
