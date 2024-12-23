<script setup>
  import { 
    ref, reactive, onMounted, 
    provide, inject, watch,
    isProxy, toRaw 
  } from "vue";

  import { 
    defined,
    Color,
    Camera,
    Rectangle,
    Cartesian3, 
    Cesium3DTileStyle,
    createOsmBuildingsAsync, 
    createWorldImageryAsync,
    Cesium3DTileset, 
    Ion, Math as CesiumMath, 
    IonWorldImageryStyle,
    Terrain, Viewer,
    RequestScheduler,
    viewerCesium3DTilesInspectorMixin,
    knockout,
    ArcGisMapServerImageryProvider,
    OpenStreetMapImageryProvider,
    TileMapServiceImageryProvider,
    WebMapTileServiceImageryProvider,
    WebMapServiceImageryProvider,
    GridImageryProvider,
    TileCoordinatesImageryProvider,
    ImageryLayer,
    defaultValue,
    buildModuleUrl,
    CesiumTerrainProvider,
    IonImageryProvider,
    ImageryProvider,
    Ellipsoid,
    IonResource,
    EllipsoidTerrainProvider,
  } from 'cesium';
  import "cesium/Build/Cesium/Widgets/widgets.css";

  import {
    MDBInput,  MDBTextarea,
    MDBCol,  MDBRow,  MDBContainer,
    MDBSelect,  MDBDatepicker,  MDBBtn,  MDBPopconfirm,
    MDBSpinner,  MDBAnimation,  MDBAlert,
    MDBModal,  MDBModalHeader,  MDBModalTitle,  MDBModalBody,  MDBModalFooter,
    MDBSwitch,
  } from 'mdb-vue-ui-kit';

  //#region ======參數======
    const layerManagerWidth = ref(null);
    // The URL on your server where CesiumJS's static files are hosted.
    window.CESIUM_BASE_URL = '/Cesium';

    // Your access token can be found at: https://ion.cesium.com/tokens.
    // Replace `your_access_token` with your Cesium ion access token.
    const google_token = ref(import.meta.env.VITE_GOOGLE_Token);
    const cesium_token = ref(import.meta.env.VITE_CESIUM_Token);
    Ion.defaultAccessToken = cesium_token.value;

    let cs_viewer;
    let cs_camera;
    let imageryLayers;

    let extent = Rectangle.fromDegrees(121.137153,23.981800,121.142690,23.977894);
    Camera.DEFAULT_VIEW_RECTANGLE = extent;
    Camera.DEFAULT_VIEW_FACTOR = 0.0005;
    
    // google Maptile 加速使用
    RequestScheduler.requestsByServer["tile.googleapis.com:443"] = 18;

  const viewModel = {
    layers: [],
    imglayers: [],
    baseLayers: [],
    tilelayers: [],
    terrainLayers: [],
    upLayer: null,
    downLayer: null,
    selectedLayer: null,
    terrainLayer: null,
    isSelectableLayer: function (layer) {
      return this.baseLayers.indexOf(layer) >= 0;
    },
    isTilesleLayer: function (layer) {
      return this.tilelayers.indexOf(layer) >= 0;
    },
    raise: function (layer, index) {
      imageryLayers.raise(layer);
      viewModel.upLayer = layer;
      viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
      updateLayerList();
      window.setTimeout(function () {
        viewModel.upLayer = viewModel.downLayer = null;
      }, 10);
    },
    lower: function (layer, index) {
      imageryLayers.lower(layer);
      viewModel.upLayer =
      viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
      viewModel.downLayer = layer;
      updateLayerList();
      window.setTimeout(function () {
        viewModel.upLayer = viewModel.downLayer = null;
      }, 10);
    },
    canRaise: function (layerIndex) {
      return layerIndex > this.tilelayers.length;
    },
    canLower: function (layerIndex) {
      return layerIndex >= this.tilelayers.length && layerIndex < (this.tilelayers.length+imageryLayers.length) - 1;
    },
  };

  const baseLayers = viewModel.baseLayers;
  const terrainLayers = viewModel.terrainLayers;
  knockout.track(viewModel);

  function setupLayers() {
    // Create all the base layers that this example will support.
    // These base layers aren't really special.  It's possible to have multiple of them
    // enabled at once, just like the other layers, but it doesn't make much sense because
    // all of these layers cover the entire globe and are opaque.
    // addBaseLayerOption("Bing Maps Aerial", createWorldImageryAsync());
    // addBaseLayerOption(
    //   "Bing Maps Road",
    //   createWorldImageryAsync({
    //     style: IonWorldImageryStyle.ROAD,
    //   }),
    // );
    // addBaseLayerOption(
    //   "ArcGIS World Street Maps",
    //   ArcGisMapServerImageryProvider.fromUrl(
    //     "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
    //   ),
    // );
    addBaseLayerOption("OpenStreetMaps", new OpenStreetMapImageryProvider());
    // addBaseLayerOption(
    //   "Stamen Maps",
    //   new OpenStreetMapImageryProvider({
    //     url: "https://stamen-tiles.a.ssl.fastly.net/watercolor/",
    //     fileExtension: "jpg",
    //     credit:
    //       "Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.",
    //   }),
    // );
    // addBaseLayerOption(
    //   "Natural Earth II (local)",
    //   TileMapServiceImageryProvider.fromUrl(
    //     buildModuleUrl("Assets/Textures/NaturalEarthII"),
    //   ),
    // );
    // addBaseLayerOption(
    //   "USGS Shaded Relief (via WMTS)",
    //   new WebMapTileServiceImageryProvider({
    //     url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS",
    //     layer: "USGSShadedReliefOnly",
    //     style: "default",
    //     format: "image/jpeg",
    //     tileMatrixSetID: "default028mm",
    //     maximumLevel: 19,
    //     credit: "U. S. Geological Survey",
    //   }),
    // );

    addBaseLayerOption(
      "臺灣通用電子地圖(正射影像)",
      new WebMapTileServiceImageryProvider({
        url: "https://wmts.nlsc.gov.tw/wmts",
        layer: "PHOTO2",
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "GoogleMapsCompatible",
        maximumLevel: 19,
        credit: "maps.nlsc.gov.tw",
      }),
    );

    // Create the additional layers
    // addAdditionalLayerOption(
    //   "United States GOES Infrared",
    //   new WebMapServiceImageryProvider({
    //     url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?",
    //     layers: "goes_conus_ir",
    //     credit: "Infrared data courtesy Iowa Environmental Mesonet",
    //     parameters: {
    //       transparent: "true",
    //       format: "image/png",
    //     },
    //   }),
    // );
    addAdditionalLayerOption(
      "United States Weather Radar",
      new WebMapServiceImageryProvider({
        url: "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?",
        layers: "nexrad-n0r",
        credit: "Radar data courtesy Iowa Environmental Mesonet",
        parameters: {
          transparent: "true",
          format: "image/png",
        },
      }),
    );
    addAdditionalLayerOption("Grid", new GridImageryProvider(), 1.0, false);
    addAdditionalLayerOption(
      "Tile Coordinates",
      new TileCoordinatesImageryProvider(),
      1.0,
      false,
    );
  }

  async function addBaseLayerOption(name, imageryProviderPromise) {
    try {
      const imageryProvider = await Promise.resolve(imageryProviderPromise);
      const layer = new ImageryLayer(imageryProvider);
      layer.name = name;
      baseLayers.push(layer);
      updateLayerList();
    } catch (error) {
      console.error(`There was an error while creating ${name}. ${error}`);
    }
  }
  async function addTerrainLayerOption(name, terrainProviderPromise) {
      const layer = terrainProviderPromise
      layer.name = name;
      terrainLayers.push(layer);
      // updateLayerList();
  }

  async function addAdditionalLayerOption(
    name,
    imageryProviderPromise,
    alpha,
    show,
  ) {
    try {
      const imageryProvider = await Promise.resolve(imageryProviderPromise);
      const layer = new ImageryLayer(imageryProvider);
      layer.alpha = defaultValue(alpha, 0.5);
      layer.show = defaultValue(show, true);
      layer.name = name;
      imageryLayers.add(layer);
      knockout.track(layer, ["alpha", "show", "name"]);
      updateLayerList();
    } catch (error) {
      console.error(`There was an error while creating ${name}. ${error}`);
    }
  }
  async function add3DTilesLayerOption(
    name,
    asset_id,
    alpha,
    show,
  ) {
    try {
      const layer = await Cesium3DTileset.fromIonAssetId(asset_id);
        let options = defaultValue(null, defaultValue.EMPTY_OBJECT);

        let style = options.style;

        if (!defined(style)) {
          const color = defaultValue(
            options.defaultColor,
            Color.WHITE,
          ).toCssColorString();
          style = new Cesium3DTileStyle({
            color: `Boolean(\${feature['cesium#color']}) ? color(\${feature['cesium#color']}) : ${color}`,
          });
        }
      layer.style = style;
      layer.alpha = defaultValue(alpha, 1);
      layer.show = defaultValue(show, true);
      layer.name = name;
      cs_viewer.scene.primitives.add(layer);

      knockout.track(layer, ["alpha", "show", "name"]);
      updateLayerList();
    } catch (error) {
      console.error(`There was an error while creating ${name}. ${error}`);
    }
  }

  function updateLayerList() {
    const numLayers = imageryLayers.length;
    viewModel.imglayers.splice(0, viewModel.imglayers.length);
    for (let i = numLayers - 1; i >= 0; --i) {
      viewModel.imglayers.push(imageryLayers.get(i));
    }

    const numTileLayers = cs_viewer.scene.primitives.length;
    viewModel.tilelayers.splice(0, viewModel.tilelayers.length);
    for (let i = numTileLayers - 1; i >= 0; --i) {
      viewModel.tilelayers.push(cs_viewer.scene.primitives.get(i));
    }


    viewModel.layers.splice(0, viewModel.layers.length);
    viewModel.layers=[...viewModel.tilelayers, ...viewModel.imglayers];

    console.log('viewModel',viewModel);
  }

// Cesium初始化
  async function initCesiumView(viewer,options) {
    // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
    viewer = new Viewer('cesiumContainer', {
      animation: true,
      baseLayerPicker: true,
      // fullscreenButton: false,
      // vrButton: false,
      geocoder: false,
      homeButton: true,
      // infoBox: false,
      sceneModePicker: true,
      // selectionIndicator: false,
      timeline: true,
      navigationHelpButton: false,
      // navigationInstructionsInitiallyVisible: true,
      // scene3DOnly: false,
      // shouldAnimate: true,
      // clockViewModel: 
      // selectedImageryProviderViewModel
      // imageryProviderViewModels
      // selectedTerrainProviderViewModel
      // terrainProviderViewModels
      // baseLayer
      // terrainProvider
      // terrain: Terrain.fromWorldTerrain(),
      // skyBox
      // skyAtmosphere
      // fullscreenElement
      // useDefaultRenderLoop
      // targetFrameRate
      // showRenderLoopErrors
      // useBrowserRecommendedResolution
      // automaticallyTrackDataSourceClocks
      // contextOptions
      // sceneMode
      // mapProjection
      // globe
      // orderIndependentTranslucency
      // creditContainer
      // creditViewport
      // dataSources
      shadows: false,
      // terrainShadows
      // mapMode2D
      projectionPicker: false,
      // blurActiveElementOnCanvasFocus: true,
      // requestRenderMode: false,
      // maximumRenderTimeChange
      // depthPlaneEllipsoidOffset
      // msaaSamples
    });   

    // Logo none
    viewer.bottomContainer.style.display = "none";
    // 顯示FTS視窗
    viewer.scene.debugShowFramesPerSecond = true;
    // 設定自動遮蔽低於地形高度的模型
    viewer.scene.globe.depthTestAgainstTerrain = false;
    // 設定是否允許攝影機進入地下
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = true;

    // cs_viewer.extend(viewerCesium3DTilesInspectorMixin);
    // const inspectorViewModel = cs_viewer.cesium3DTilesInspector.viewModel;

    // const imageryLayers = viewer.imageryLayers;
    
    // camera 飛到指定地點 使用經緯度、橢球高
    // let camera;
    // camera = viewer.camera;
    // camera.flyTo({
    //   // destination: Cartesian3.fromDegrees(120.6638, 24.147, 2000),
    //   destination: Cartesian3.fromDegrees(121,24,100000),
    //   // orientation: {
    //   //   heading: CesiumMath.toRadians(0.0),
    //   //   pitch: CesiumMath.toRadians(-85.0),
    //   // }
    // });
    console.log('Cesium初始化')
    return viewer;
  } 

// 載入底圖(廢棄)
  // let googleTerrainLayer;
  // function load3DTilestLayer(viewer){
  //   console.log('load3DTilestLayer')
  //   // console.log('out: ',viewer);
  //   // Add Cesium OSM Buildings, a global 3D buildings layer.
  //   createOsmBuildingsAsync().then((buildingTileset)=>{
  //     // console.log('osm-b: ',buildingTileset);
  //     buildingTileset.show = false;
  //     viewer.scene.primitives.add(buildingTileset);   
  //   })
  //   Cesium3DTileset.fromUrl("https://tile.googleapis.com/v1/3dtiles/root.json?key=" + google_token.value).then(tileset=>{
  //     googleTerrainLayer = tileset;
  //     viewer.imageryLayers.add(googleTerrainLayer);
  //     // console.log('goole: ',tileset);
  //     // tileset.show = true;
  //     // viewer.scene.primitives.add(tileset); 
  //   });
  // }

  function getIonResouse(viewer){
    // 使用 Ion API 獲取資源清單
    // 獲取 Ion 資產清單
    fetch('https://api.cesium.com/v1/assets', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${Ion.defaultAccessToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      // console.log('Ion assets:', data);
      data.items.forEach(asset => {
        // 根據資產類型載入
        switch (asset.type.toUpperCase()) {
          case 'IMAGERY':
            addBaseLayerOption(asset.name, IonImageryProvider.fromAssetId(2));
            console.log(`Loaded imagery asset: ${asset.name}`);
            break;

          case 'TERRAIN':
            addTerrainLayerOption(asset.name, CesiumTerrainProvider.fromIonAssetId(asset.id));
            console.log(`Loaded terrain asset: ${asset.name}`);
            break;

          case '3DTILES':
            add3DTilesLayerOption(asset.name, asset.id, 1, false);
            console.log(`Loaded 3D tileset asset: ${asset.name}`);
            break;

          default:
            console.log(`Unsupported asset type: ${asset.type}`);
        }
        
      });
      addTerrainLayerOption('無',new EllipsoidTerrainProvider());
    })
    .catch(error => {
      console.error('Error fetching Ion assets:', error);
    });
  }
// 頁面渲染完成後執行步驟
  onMounted( async function () {
    cs_viewer = await initCesiumView(cs_viewer,'');
    // console.log(cs_viewer);
    
    imageryLayers = cs_viewer.imageryLayers;
    setupLayers();
    getIonResouse();

    // 將toolbar綁定至knockout
    const toolbar = document.getElementById("toolbar");
    knockout.applyBindings(viewModel, toolbar);
    // 監聽selectedLayer變化
    knockout
      .getObservable(viewModel, "selectedLayer")
      .subscribe(function (baseLayer) {
        // console.log('knockout: ',baseLayer);
        // console.log('cs_viewer: ',cs_viewer.imageryLayers);
        // Handle changes to the drop-down base layer selector.
        let activeLayerIndex = 0;
        const numLayers = viewModel.layers.length;
        for (let i = 0; i < numLayers; ++i) {
          if (viewModel.isSelectableLayer(viewModel.layers[i])) {
            activeLayerIndex = i;
            break;
          }
        }
        // console.log('activeLayerIndex: ',activeLayerIndex);
        const activeLayer = viewModel.layers[activeLayerIndex];
        const show = activeLayer.show;
        const alpha = activeLayer.alpha;
        imageryLayers.remove(activeLayer, false);
        imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
        baseLayer.show = show;
        baseLayer.alpha = alpha;
        updateLayerList();
        
      });
    // 監聽terrainLayer變化
    knockout
      .getObservable(viewModel, "terrainLayer")
      .subscribe(function (terrain) {
        cs_viewer.scene.setTerrain(
          new Terrain(terrain),
        );

      });

      console.log('cesiumImgLayers: ',imageryLayers);
      // console.log('viewModel: ',viewModel);
  });

  // 切換顯示圖層管理工具
  function showLayerManager(){
    const box = document.getElementById('layerManager');
        
    if (box.classList.contains('toolvisible')) {
      layerManagerWidth.value = box.getBoundingClientRect().width;
      // console.log('init:',box.style.width)
      if (box.style.width){
        box.style.width = 0;
        box.classList.remove('toolvisible');
        box.classList.add('toolhidden');
      }else{
        box.style.width = layerManagerWidth.value + 'px';
        // console.log('layerManagerWidth: ',box.style.width)
        box.classList.add('addTrans');
        setTimeout(() => {
          box.style.width = 0;
          box.classList.remove('toolvisible');
          box.classList.add('toolhidden');
        }, 0);
      }
    } else {
      // console.log('toolhidden',layerManagerWidth.value)
      box.classList.remove('toolhidden');
      box.style.width = layerManagerWidth.value + 'px'; // 使用具體的內容寬度
      setTimeout(() => {
        box.classList.add('toolvisible');
      }, 10);
    }
  }
</script>

<template>
  <MDBContainer fluid class="h-100">
    <div id="cesiumContainer" class="border h-100 w-100">
      <!-- <div class="cursorH border-bottom border-danger"></div> -->
      <!-- <div class="cursorV border-end border-danger"></div> -->
    </div>
    <div id="loadingOverlay"><h1>Loading...</h1></div>
    <div id="toolbar">
      <div id="layerManager" class="toolvisible">
        <div>
          <table>
            <tbody data-bind="foreach: layers">
              <tr data-bind="css: { up: $parent.upLayer === $data, down: $parent.downLayer === $data }">
                <td><input type="checkbox" data-bind="checked: show"></td>
                <td>
                  <span data-bind="text: name, visible: !$parent.isSelectableLayer($data)"></span>
                  <select data-bind="visible: $parent.isSelectableLayer($data), options: $parent.baseLayers, optionsText: 'name', value: $parent.selectedLayer"></select>                  
                </td>
                <td>
                  <input type="range" min="0" max="1" step="0.01" data-bind="value: alpha, valueUpdate: 'input'">
                </td>
                <td>
                  <button type="button" class="cesium-button" data-bind="click: function() { $parent.raise($data, $index()); }, visible: $parent.canRaise($index())">
                    ▲
                  </button>
                </td>
                <td>
                  <button type="button" class="cesium-button" data-bind="click: function() { $parent.lower($data, $index()); }, visible: $parent.canLower($index())">
                    ▼
                  </button>
                </td>
              </tr>
              
            </tbody>
            <tbody>
              <tr>
                <td>目前地形</td>
                <td>
                  <select data-bind="options: terrainLayers, optionsText: 'name', value: terrainLayer"></select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
      </div>
      <button id="hiddenBtn" class="cesium-button" @click.stop="showLayerManager">
        <div class="btnVline"></div>
      </button>
    </div>  
  </MDBContainer>
</template>
<style scoped>
#toolbar {
  display: flex;
  align-items: center;
  color: white;
  position: absolute;
  max-width: calc(100% - 3rem);
  max-height: calc(100% - 150px);
  top: 2rem;
  left: 0.5rem;
  /* overflow: hidden; */
  z-index: 2;
}

#layerManager input {
  vertical-align: middle;
  padding-top: 2px;
  padding-bottom: 2px;
}
#layerManager table tr>td:nth-child(2){
  padding-left: 1rem;
}
#layerManager table tr>td:nth-child(1){
  text-align: right;
}

#layerManager table tr {
  transform: translateY(0);
  transition: transform 0.4s ease-out;
}

table tr>td:nth-child(1){
  min-width: 5rem;
}

#layerManager table tr.up {
  transform: translateY(33px);
  transition: none;
}

#layerManager table tr.down {
  transform: translateY(-33px);
  transition: none;
}

#layerManager>div{
  background: rgba(42, 42, 42, 0.8);
  padding: 4px;
  border-radius: 4px;
}

#layerManager{
  padding: 0;
  border: 0;
  overflow: hidden;
}
.addTrans{
  transition: width 1s ease; /* 添加過渡效果 */
}


#hiddenBtn {
  display: flex;
  align-items: center; /* 垂直置中 */
  justify-content: center; /* 水平置中 */
  position: absolute;
  margin: 0;
  padding: 0;
  min-height: 3rem;
  height: calc(100% - 2rem);
  right: -1rem;
  width: 1rem;
  background-color: rgba(42, 42, 42, 0.8);
  border-radius: 0 0.5rem 0.5rem 0;
  
}

#hiddenBtn:focus {
  border:none;
  outline: none;
}
#hiddenBtn:hover {
  box-shadow: 4px 0 8px #fff; /* 右側陰影 */
}

.btnVline{
  position: absolute;
  height: 90%;
  width: 0.3rem;
  border-left: 1px solid rgb(167, 167, 167);
  border-right: 1px solid rgb(167, 167, 167);
}
</style>