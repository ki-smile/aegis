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
          data: [0.890, 0.882, 0.880, 0.871, 0.790, 0.752, 0.764, 0.781, 0.650, 0.612, 0.428],
          borderColor: '#4DB5BC',
          backgroundColor: 'rgba(77, 181, 188, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'MLcps',
          data: [0.876, 0.869, 0.865, 0.847, 0.801, 0.778, 0.784, 0.790, 0.671, 0.645, 0.430],
          borderColor: '#870052',
          backgroundColor: 'rgba(135, 0, 82, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'P_fail (Sensitivity)',
          data: [0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65],
          borderColor: '#B84145',
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'R_G (Sensitivity)',
          data: [0.66, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66, 0.66],
          borderColor: '#F59A00',
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    };

    // Decision labels for sepsis
    var sepsisDecisions = [
      'APPROVE', 'APPROVE', 'APPROVE', 'APPROVE',
      'COND. APPROVE', 'COND. APPROVE', 'COND. APPROVE', 'COND. APPROVE',
      'REJECT', 'REJECT', 'REJECT+ALARM'
    ];

    // BraTS data — Manuscript Table IX (iterations 0–12)
    var bratsData = {
      labels: ['k=0', 'k=1', 'k=2', 'k=3', 'k=4', 'k=5', 'k=6', 'k=7', 'k=8', 'k=9', 'k=10', 'k=11', 'k=12'],
      datasets: [
        {
          label: 'Golden DSC',
          data: [0.912, 0.908, 0.905, 0.901, 0.895, 0.887, 0.876, 0.862, 0.845, 0.821, 0.792, 0.758, 0.710],
          borderColor: '#4DB5BC',
          backgroundColor: 'rgba(77, 181, 188, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'Drifting DSC',
          data: [0.905, 0.897, 0.882, 0.861, 0.835, 0.804, 0.769, 0.728, 0.682, 0.631, 0.575, 0.514, 0.448],
          borderColor: '#FF876F',
          backgroundColor: 'rgba(255, 135, 111, 0.1)',
          tension: 0.3,
          fill: false,
          pointRadius: 5
        },
        {
          label: 'P_fail (DSC)',
          data: [0.70, 0.70, 0.70, 0.70, 0.70, 0.70, 0.70, 0.70, 0.70, 0.70, 0.70, 0.70, 0.70],
          borderColor: '#B84145',
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    };

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
                if (activeDataset === 'sepsis' && sepsisDecisions[context[0].dataIndex]) {
                  return 'Decision: ' + sepsisDecisions[context[0].dataIndex];
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
