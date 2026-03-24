/* AEGIS Results Chart — Chart.js 4
   Sepsis (Table VIII) and BraTS (Table IX) datasets.
   Toggle between datasets with buttons. */

(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById('results-chart');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');

    // Sepsis data — Manuscript Table VIII (iterations 0–10)
    var sepsisData = {
      labels: ['k=0', 'k=1', 'k=2', 'k=3', 'k=4', 'k=5', 'k=6', 'k=7', 'k=8', 'k=9', 'k=10'],
      datasets: [
        {
          label: 'Sensitivity',
          data: [0.723, 0.745, 0.745, 0.742, 0.742, 0.753, 0.809, 0.702, 0.697, 0.824, 0.428],
          borderColor: '#4DB5BC',
          backgroundColor: 'rgba(77, 181, 188, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'MLcps',
          data: [0.721, 0.731, 0.731, 0.729, 0.733, 0.739, 0.746, 0.716, 0.716, 0.739, 0.549],
          borderColor: '#870052',
          backgroundColor: 'rgba(135, 0, 82, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'AUC',
          data: [0.922, 0.922, 0.923, 0.923, 0.923, 0.924, 0.922, 0.922, 0.920, 0.919, 0.912],
          borderColor: '#6A9F5B',
          backgroundColor: 'rgba(106, 159, 91, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'Specificity',
          data: [0.933, 0.926, 0.926, 0.926, 0.932, 0.929, 0.881, 0.950, 0.956, 0.856, 0.999],
          borderColor: '#F59A00',
          backgroundColor: 'rgba(245, 154, 0, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'Drift',
          data: [0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.412, 0.000, 1.000, 0.029, 1.000],
          borderColor: '#B84145',
          backgroundColor: 'rgba(184, 65, 69, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5,
          borderDash: [6, 3]
        }
      ]
    };

    // Decision labels for sepsis
    var sepsisDecisions = [
      'APPROVE', 'APPROVE', 'APPROVE', 'APPROVE',
      'APPROVE', 'APPROVE', 'COND. APPR.', 'CLIN. REV.',
      'APPROVE / ALARM', 'APPROVE', 'REJECT / ALARM'
    ];

    // BraTS data — Manuscript Table IX (iterations 0–12)
    var bratsData = {
      labels: ['k=0', 'k=1', 'k=2', 'k=3', 'k=4', 'k=5', 'k=6', 'k=7', 'k=8', 'k=9', 'k=10', 'k=11', 'k=12'],
      datasets: [
        {
          label: 'Golden DSC (P_G,k)',
          data: [0.726, 0.646, 0.673, 0.690, 0.700, 0.725, 0.726, 0.742, 0.723, 0.714, 0.706, 0.707, 0.698],
          borderColor: '#4DB5BC',
          backgroundColor: 'rgba(77, 181, 188, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'Drifting DSC (P_D,k)',
          data: [null, 0.694, 0.748, 0.745, 0.758, 0.735, 0.836, 0.892, 0.910, 0.900, 0.904, 0.931, null],
          borderColor: '#FF876F',
          backgroundColor: 'rgba(255, 135, 111, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        }
      ]
    };

    // Decision labels for BraTS
    var bratsDecisions = [
      '— (reference)', 'REJECT', 'REJECT', 'APPROVE / ALARM',
      'APPROVE', 'APPROVE / ALARM', 'APPROVE', 'APPROVE',
      'APPROVE', 'REJECT / ALARM', 'REJECT', 'REJECT', 'REJECT'
    ];

    var chart = new Chart(ctx, {
      type: 'line',
      data: JSON.parse(JSON.stringify(sepsisData)),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: "'DM Sans', sans-serif", size: 13 },
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            callbacks: {
              afterBody: function (context) {
                var idx = context[0].dataIndex;
                if (activeDataset === 'sepsis' && sepsisDecisions[idx]) {
                  return 'Decision: ' + sepsisDecisions[idx];
                }
                if (activeDataset === 'brats' && bratsDecisions[idx]) {
                  return 'Decision: ' + bratsDecisions[idx];
                }
                return '';
              }
            }
          }
        },
        scales: {
          y: {
            min: 0.3,
            max: 1.0,
            title: {
              display: true,
              text: 'Score',
              font: { family: "'DM Sans', sans-serif" }
            },
            grid: { color: 'rgba(128,128,128,0.15)' }
          },
          x: {
            title: {
              display: true,
              text: 'Iteration',
              font: { family: "'DM Sans', sans-serif" }
            },
            grid: { display: false }
          }
        }
      }
    });

    var activeDataset = 'sepsis';

    var btnSepsis = document.getElementById('toggle-sepsis');
    var btnBrats = document.getElementById('toggle-brats');

    if (btnSepsis) {
      btnSepsis.addEventListener('click', function () {
        chart.data = JSON.parse(JSON.stringify(sepsisData));
        chart.options.scales.y.min = 0.3;
        chart.update('active');
        activeDataset = 'sepsis';
        btnSepsis.classList.add('active');
        if (btnBrats) btnBrats.classList.remove('active');
      });
    }
    if (btnBrats) {
      btnBrats.addEventListener('click', function () {
        chart.data = JSON.parse(JSON.stringify(bratsData));
        chart.options.scales.y.min = 0.3;
        chart.update('active');
        activeDataset = 'brats';
        btnBrats.classList.add('active');
        if (btnSepsis) btnSepsis.classList.remove('active');
      });
    }
  });
})();
