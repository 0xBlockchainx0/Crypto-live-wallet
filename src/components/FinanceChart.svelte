<script>
    import Chart from 'chart.js/auto';
    import 'chartjs-adapter-luxon';
    import annotationPlugin from 'chartjs-plugin-annotation';
    import Roller from './Roller.svelte';
    Chart.register(annotationPlugin);

    export let currencyPair, transactions, lastTransactionsFetch, volumes, buysOffers, sellsOffers, rsi, rsiPeriod,
			trendSymbol, profit, avgBuyRate;

    let canvas, chart, chartIsInitialised = false;

    $: if(buysOffers.length > 1) {
        if (chartIsInitialised) {
            chart.options.plugins.title.text = getTitle();
            chart.update();
        } else {
            drawPlot();
            chartIsInitialised = true;
        }
    }

    $: if(chartIsInitialised) {
        if (avgBuyRate == null) {
            chart.options.plugins.annotation.annotations = {};
            chart.update();
        } else {
            chart.options.plugins.annotation = {
                annotations: {
                    avgBuyRate: {
                        type: 'line',
                        scaleID: 'y',
                        value: avgBuyRate,
                        borderColor: 'rgba(149, 165, 166, 1)',
                        borderWidth: 5,
                        borderDash: [10, 5],
                        label: {
                            content: () => `Avg buy rate: ${avgBuyRate} ${currencyPair.split('-')[1]}`,
                            enabled: true
                        }
                    }
                }
            }

            chart.update();
        }
    }

    function getTitle() {
        return `${currencyPair} ${trendSymbol}`;
    }

    function drawPlot() {
        chart = new Chart(canvas, {
            data: {
                datasets: [{
                    label: 'Transaction',
                    type: 'line',
                    data: transactions,
                    borderColor: 'rgba(0, 0, 255, 0.4)',
                    backgroundColor: 'rgba(0, 0, 255, 0.4)',
                },
                {   
                    label: 'Volume',
                    type: 'bar',
                    data: volumes,
                    yAxisID: 'yVolume',
                    borderColor: 'rgba(103, 128, 159, 0.6)'
                },
                {
                    label: 'Best buy offer',
                    type: 'line',
                    data: buysOffers,
                    borderColor: 'rgba(135, 211, 124, 1)',
                    backgroundColor: 'rgba(135, 211, 124, 1)',
                    pointRadius: 0
                },
                {
                    label: 'Best sell offer',
                    type: 'line',
                    data: sellsOffers,
                    borderColor: 'rgba(240, 52, 52, 1)',
                    backgroundColor: 'rgba(240, 52, 52, 1)',
                    pointRadius: 0
                },
                {
                    label: 'RSI',
                    type: 'line',
                    data: rsi,
                    yAxisID: 'yRSI',
                    borderColor: 'rgba(189, 195, 199, 1)',
                    backgroundColor: 'rgba(189, 195, 199, 1)',
                    borderDash: [10, 5]
                }]
            },
            options: {
                maintainAspectRatio: false,
                legend: {
                    labels: {
                        defaultFontSize: 30
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: currencyPair,
                        font: {
                            size: 18
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            minUnit: 'second',
                            stepSize: 2
                        },
                        ticks: {
                            source: 'auto',
                            maxRotation: 10,
                            autoSkip: true,
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: `Cena [${currencyPair.split('-')[1]}]`,
                        }
                    },
                    yVolume: {
                        title: {
                            display: true,
                            text: `Volumen [${currencyPair.split('-')[0]}]`
                        },
                        grid: {
                            display: false
                        }
                    },
                    yRSI: {
                        min: 0,
                        max: 100,
                        position: 'right',
                        title: {
                            display: true,
                            text: `RSI [${rsiPeriod}]`
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        canvas.style.display='block';
    }
</script>

<div class='chart-container container-box'>
    <div class='chart-container__chart'>
        {#if !chartIsInitialised}
        <div>
            <Roller />
        </div>
        <h4>Loading {currencyPair} chart, please wait...</h4>
        {/if }

        <canvas bind:this={canvas} />
    </div>
    <div class='chart-container__profit'> 
        <b>Profit:</b>
        <br>
        {profit} {currencyPair.split('-')[1]}
    </div>
</div>

<style>
    .chart-container {
		margin-bottom: 30px;
    }

    .chart-container__chart {
        margin: auto;
        text-align: center;
        max-height: 350px;
    } 

    .chart-container__profit {
        padding-top: 15px;
        text-align: center;
        margin: auto;
    }

    canvas {
        background-color: white;
        display: none;
    }
</style>