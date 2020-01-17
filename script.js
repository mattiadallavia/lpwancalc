var c = 299792458; // Speed of light (m/s)
var kb = 1.38064852 * 10e-23; // Boltzmann constant
var temp = 290; // (K)
var spectral_eff = 0.5;

var n0 = kb * temp;

google.charts.load('current', {packages: ['corechart', 'line']});
var plot_att_options =
{
	hAxis: {
		title: 'Distance (m)',
		minValue: 0,
		maxValue: 10000,
		gridlines: { count: 10 },
		minorGridlines: { count: 0 },
		baselineColor: '#ccc',
		slantedText: true,
		slantedTextAngle: 90
	},
	vAxis: {
		title: 'Receiver signal power (dBm)',
		minValue: -100,
		maxValue: -50,
		gridlines: { count: 10 },
		minorGridlines: { count: 0 },
		baselineColor: '#ccc'
	},
	series: {
		1: { color: 'black', pointSize: 5 },
		2: { color: 'black', lineWidth: 1.5, lineDashStyle: [4, 4] }
	},
	enableInteractivity: false,
	legend: { position: 'none' },
	chartArea: { top: 10, right: 20, bottom: 80, left: 50, width: '100%', height: '100%' }
};

function calc ()
{
	var pow_tx_w, pow_tx_dbm;
	var pow_rx_dbm;
	var gain_tx_dbi;
	var gain_rx_dbi;
	var dist_m;
	var path_loss_db;
	var freq, wavelength, bandwidth;
	var data_rate;
	var ebn0_db, ebn0_ww;
	var noise_figure_db;
	var p_err_bit;
	var pow_req_dbm;
	var pow_margin_db;
	var pow_noise_w, pow_noise_dbm;
	var plot_att, plot_att_data, plot_att_chart;
	
	pow_tx_w = parseFloat(document.getElementById("in-pow-tx").value);
	gain_tx_dbi = parseInt(document.getElementById("in-gain-tx").value);
	gain_rx_dbi = parseInt(document.getElementById("in-gain-rx").value);
	dist_m = parseInt(document.getElementById("in-dist").value);
	freq = parseInt(document.getElementById("in-freq").value);
	data_rate = parseInt(document.getElementById("in-data-rate").value);
	ebn0_db = parseInt(document.getElementById("in-ebn0").value);
	noise_figure_db = parseInt(document.getElementById("in-noise-figure").value);
	plot_att = document.getElementById("plot-att");
	
	wavelength = c / freq; // (m)
	pow_tx_dbm = 10*Math.log10(pow_tx_w * 1000);
	ebn0_ww = Math.pow(10, ebn0_db/10);
	path_loss_db = 20*Math.log10(wavelength / (4*Math.PI * dist_m));
	
	pow_rx_dbm = pow_tx_dbm + gain_tx_dbi + gain_rx_dbi + path_loss_db;
	
	p_err_bit = 1/2 * erfc(Math.sqrt(ebn0_ww/2));
	
	pow_req_dbm = ebn0_db + 10*Math.log10(data_rate * n0 * 1000) + noise_figure_db;
	pow_margin_db = pow_rx_dbm - pow_req_dbm;
	
	bandwidth = data_rate / spectral_eff;
	
	pow_noise_w = bandwidth * n0;
	pow_noise_dbm = 10*Math.log10(pow_noise_w * 1000);
	
	plot_att_chart = new google.visualization.LineChart(plot_att);
	plot_att_data = new google.visualization.DataTable();
    plot_att_data.addColumn('number');
    plot_att_data.addColumn('number');
	plot_att_data.addColumn('number');
	plot_att_data.addColumn('number');
	
	for (var d = 0; d <= 10000; d += 100)
	{
		var prx, pl;

		pl = 20*Math.log10(wavelength / (4*Math.PI * d));
		prx = pow_tx_dbm + gain_tx_dbi + gain_rx_dbi + pl;

		plot_att_data.addRow([d, prx, null, null]);
	}
	
	plot_att_data.addRow([dist_m, null, pow_rx_dbm, null]);
	plot_att_data.addRow([0, null, null, pow_req_dbm]);
	plot_att_data.addRow([10000, null, null, pow_req_dbm]);
	
	plot_att_chart.draw(plot_att_data, plot_att_options);
	
	document.getElementById("out-pow-tx").value = pow_tx_dbm.toFixed(2);
	document.getElementById("out-gain-tx").value = gain_tx_dbi;
	document.getElementById("out-path-loss").value = path_loss_db.toFixed(2);
	document.getElementById("out-gain-rx").value = gain_rx_dbi;
	document.getElementById("out-pow-rx").value = pow_rx_dbm.toFixed(2);
	document.getElementById("out-p-err-bit").value = (p_err_bit * 100).toFixed(5);
	document.getElementById("out-pow-req").value = pow_req_dbm.toFixed(2);
	document.getElementById("out-pow-margin").value = pow_margin_db.toFixed(2);
	document.getElementById("out-wavelength").value = wavelength.toFixed(3);
	document.getElementById("out-bandwidth").value = bandwidth;
	document.getElementById("out-pow-noise").value = pow_noise_dbm.toFixed(2);
}

function erf (x)
{
    // erf(x) = 2/sqrt(pi) * integrate(from=0, to=x, e^-(t^2) ) dt
    // with using Taylor expansion, 
    //        = 2/sqrt(pi) * sigma(n=0 to +inf, ((-1)^n * x^(2n+1))/(n! * (2n+1)))
    // calculationg n=0 to 50 bellow (note that inside sigma equals x when n = 0, and 50 may be enough)
    var m = 1.00;
    var s = 1.00;
    var sum = x * 1.0;

    for(var i = 1; i < 50; i++)
	{
        m *= i;
        s *= -1;
        sum += (s * Math.pow(x, 2.0 * i + 1.0)) / (m * (2.0 * i + 1.0));
    }
	
    return 2 * sum / Math.sqrt(Math.PI);
}

function erfc (x)
{
	return 1 - erf(x);
}
