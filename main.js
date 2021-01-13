window.onload = init;

function init() {
    // Get HTML Elements
    var popupContainer = document.getElementById('popup');
    var popupContent = document.getElementById('popup-content');
    var popupCloser = document.getElementById('popup-closer');


    // Layers
    // Open Street Map
    const openStreetMap = new ol.layer.Tile({
        source: new ol.source.OSM()
    });

    // Vector Layer
    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: './data/geojson/countries.geojson',
            format: new ol.format.GeoJSON()
        })
    })

    // Tile Debug
    const tileDebugLayer = new ol.layer.Tile({
        source: new ol.source.TileDebug(),
    });

    // Stamen Terrain
    const stamenTerrain = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
            attributions: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
        })
    })

    // Popup Overlay
    var popupOverlay = new ol.Overlay({
        element: popupContainer,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    });

    // HeatMap Layer
    const blur = document.getElementById('heatmap-blur');
    const radius = document.getElementById('heatmap-radius');
    const heatMapLayer = new ol.layer.Heatmap({
        source: new ol.source.Vector({
            url: 'data/geojson/heatmap.geojson',
            format: new ol.format.GeoJSON()
        }),
        radius: parseInt(radius.value, 10),
        blur: parseInt(blur.value, 10),
        visible: false,
    });



    // Interactions
    // Drag Rotate And Zoom 按住alt键旋转缩放地图
    const dragRotateAndZoom = new ol.interaction.DragRotateAndZoom({
        condition: ol.events.condition.altKeyOnly
    });


    // Controls
    // Full Screen
    const fullScreen = new ol.control.FullScreen();

    // Zoom Slider
    const zoomSlider = new ol.control.ZoomSlider();

    // Scale Line
    const scaleLine = new ol.control.ScaleLine();

    //Zoom Extent
    const zoomToExtent = new ol.control.ZoomToExtent({
        target: 'zoomToExtent',
    });

    // Overview Map(不需要)
    // var overviewMap = new ol.control.OverviewMap({
    //     className : 'ol-overviewmap ol-custom-overviewmap ol-unselectable',
    //     layers : [
    //         new ol.layer.Tile({
    //             source : new ol.source.OSM()
    //         })
    //     ],
    //     collapsed : false,
    //     rotateWithView : true,
    // })   



    // Map
    var layerGroup = [openStreetMap, vectorLayer, tileDebugLayer, stamenTerrain];
    var map = new ol.Map({
        layers: layerGroup,
        target: 'myMap',
        view: new ol.View({
            center: [0, 0],
            zoom: 5,
            minZoom: 3
        }),
        interactions: ol.interaction.defaults().extend([dragRotateAndZoom]),
        controls: ol.control.defaults().extend([fullScreen, zoomSlider, scaleLine, zoomToExtent]),
        overlays: [popupOverlay]
    })


    // Logics
    // Overlay Logic And Highlight Style 点击出现弹窗，地图相应位置出现高亮，点击取消弹窗消失，地图相应位置取消高亮
    var selected = null;
    const highlightStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.7)'
        }),
        stroke: new ol.style.Stroke({
            color: '#3399cc',
            width: 3
        })
    });

    map.on('singleclick', function(evt) {
        var coordinate = evt.coordinate;
        var hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate));
        if (selected != null) {
            selected.setStyle(undefined);
            selected = null;
        }

        map.forEachFeatureAtPixel(evt.pixel, function(f) {
            selected = f;
            f.setStyle(highlightStyle);
            return true;
        });

        if (selected) {
            var string = selected.get('name');
        } else {
            var string = '';
        }

        popupContent.innerHTML = '<p>You clicked here:&nbsp; ' + string + '</p><code>' + hdms + '</code>';
        popupOverlay.setPosition(coordinate);
    });

    popupCloser.onclick = function(f) {
        const popupPixel = map.getPixelFromCoordinate(popupOverlay.getPosition());
        map.forEachFeatureAtPixel(popupPixel, function(f) {
            f.setStyle(undefined);
            return true;
        })
        popupOverlay.setPosition(undefined);
        popupCloser.blur();
        return false;
    };

    // 图层选择及透明度设置
    const layerCheckbox = document.querySelectorAll('#tuceng');
    const layerChanger = document.getElementById('tucenggenggai');
    layerChanger.addEventListener('click', function() {
        for (var i = 0; i < layerCheckbox.length; i++) {
            if (layerGroup[i].getVisible() != layerCheckbox[i].checked) { // 图层的visible与checkbox的checked不同
                layerGroup[i].setVisible(layerCheckbox[i].checked);
            }
            var tempClass = layerCheckbox[i].className;
            const opacityValue = document.querySelectorAll('.' + tempClass)[1].value;
            if (layerCheckbox[i].checked && opacityValue != layerGroup[i].getOpacity()) {
                layerGroup[i].setOpacity(opacityValue / 100);
            }
        }
    });

    // 重置地图中心及缩放等级
    const resetViewLon = document.getElementById('viewLon');
    const resetViewLat = document.getElementById('viewLat');
    const resetViewZoom = document.getElementById('viewZoom');
    const viewChanger = document.getElementById('viewChanger');
    viewChanger.addEventListener('click', function() {
        var viewLonLat = ol.proj.toLonLat(map.getView().getCenter());
        var viewLon = viewLonLat[0];
        var viewLat = viewLonLat[1];
        var viewZoom = map.getView().getZoom();
        var inputLon = Number(resetViewLon.value);
        var inputLat = Number(resetViewLat.value);
        var inputZoom = Number(resetViewZoom.value);
        if (typeof inputLon === 'number' && 180 >= inputLon && inputLon >= -180) {
            viewLon = inputLon;
        }
        if (typeof inputLat === 'number' && 90 >= inputLat && inputLat >= -90) {
            viewLat = inputLat;
        }
        if (typeof inputZoom === 'number' && inputZoom >= 1 && inputZoom <= 26) {
            viewZoom = inputZoom + 2;
        }
        console.log();
        const viewCenter = ol.proj.fromLonLat([viewLon, viewLat]);
    });

    //热力图选择及相关设置
    map.addLayer(heatMapLayer);
    const heatmapCheckbox = document.getElementById('heatmap');
    const heatMapSubmit = document.getElementById('heatmap-submit');
    heatMapSubmit.addEventListener('click', function(e) {

        if (heatmapCheckbox.checked) { heatMapLayer.setVisible(true); } else { heatMapLayer.setVisible(false); }

        heatMapLayer.setBlur(parseInt(blur.value, 10));
        heatMapLayer.setRadius(parseInt(radius.value, 10));
    });


    //Reset View logic
    const resetView = document.querySelector('#myMap > div.ol-viewport > div.ol-overlaycontainer-stopevent > div.ol-zoom-extent.ol-unselectable.ol-control');
    resetView.addEventListener('click', function(e) {
        map.getView().animate({ center: [14071443.865327703, 3824133.995508199], rotation: 0, zoom: 4.6, duration: 800 });
    });
    const resetViewButton = document.querySelector('#myMap > div > div.ol-overlaycontainer-stopevent > div.ol-zoom-extent.ol-unselectable.ol-control > button');
    resetViewButton.innerHTML = "V";
    resetViewButton.title = 'Reset View';

    //获取echarts静态实例,初始化echarts实例
    var myChart = echarts.init(document.getElementById('popup-echarts'), 'mytheme');

    // 指定图表的配置项和数据
    option = {
        title: {
            text: '气象数据'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            data: ['温度', '降水量', '风速', '洋流', '海浪']
        },
        grid: {
            left: '10%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },

        toolbox: {
            feature: {
                saveAsImage: {},
                dataView: {},
                myTool1: {
                    show: true,
                    title: '点击关闭',
                    // icon: 'https://icons.getbootstrap.com/icons/x-square/',
                    icon: 'path: //M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z,path: //M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z',
                    onclick: function() {
                        $("#popup-echarts").css("display", "none");
                    }
                },
            },
            right: 8
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            grid: '10%'
        },
        yAxis: {
            type: 'value',
            offset: this.dataType === 'forecast' ? 50 : 24,
        },
        series: [{
                name: '温度',
                type: 'line',
                stack: '总量',
                data: [120, 132, 101, 134, 90, 230, 210],

            },
            {
                name: '降水量',
                type: 'line',
                stack: '总量',
                data: [220, 182, 191, 234, 290, 330, 310],

            },
            {
                name: '风速',
                type: 'line',
                stack: '总量',
                data: [150, 232, 201, 154, 190, 330, 410],

            },
            {
                name: '洋流',
                type: 'line',
                stack: '总量',
                data: [320, 332, 301, 334, 390, 330, 320],

            },
            {
                name: '海浪',
                type: 'bar',
                stack: '总量',
                data: [820, 932, 901, 934, 1290, 1330, 1320],
                barWidth: '20'

            }
        ]
    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);

    //添加图标图层
    const popupContainerElement = document.getElementById('popup-echarts');
    const popup = new ol.Overlay({
        element: popupContainerElement,
        positioning: 'top-left'
    })
    map.addOverlay(popup);

    //图标双击事件
    map.on('click', function(e) {
        const clickedCoordinate = e.coordinate;
        myChart.setOption({
            title: {
                subtext: ol.coordinate.toStringHDMS(ol.proj.toLonLat(clickedCoordinate)),
                subtextStyle: {
                    fontWeight: '700',
                    fontSize: 12,
                    padding: [20, 20, 100, 100],
                    color: '#000'
                }
            }
        })

        popup.setPosition(undefined);
        popup.setPosition(clickedCoordinate);
        if ($("#Echarts-switch").prop("checked") == true) {
            $("#popup-echarts").css("display", "block");
        } else {
            $("#popup-echarts").css("display", "none");
        }

    })
}