<script setup>
  import { useQuery, useMutation } from '@vue/apollo-composable';
  import UsersGQL from "../graphql/Users";
  import { 
    ref, reactive, onMounted, 
    provide, inject, watch,
    isProxy, toRaw, 
    computed
  } from "vue";
  import router from '../router'

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
    MDBAccordion, MDBAccordionItem,
  } from 'mdb-vue-ui-kit';

  //#region ======參數======
    const layerMGShow = ref(false);
    const activeItem = ref('stayOpen-collapseOne');
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
    const selectLayerIndex = ref(0);
    const terrainLayerIndex = ref(0);
    const layersets = ref({
      layers: [],
      imglayers: [],
      baseLayers: [],
      tilelayers: [],
      terrainLayers:[],
      upLayer: null,
      downLayer: null,
      // selectedLayer: null,
      terrainLayer: null,
      isSelectableLayer: function (layer) {
        // console.log('baseLayers:',toRaw(this.baseLayers));
        // console.log('layer:',toRaw(layer));
        // console.log( this.baseLayers.indexOf(layer));
        return this.baseLayers.indexOf(layer) >= 0;
      },
      isTilesleLayer: function (layer) {
        return this.tilelayers.indexOf(layer) >= 0;
      },
      raise: function (layer, index) {
        console.log('layer:',toRaw(layer),'index:',index);
        imageryLayers.raise(toRaw(layer));
        layersets.value.upLayer = layer;
        layersets.value.downLayer = layersets.value.layers[Math.max(0, index - 1)];
        updateLayerList();
        window.setTimeout(function () {
          layersets.value.upLayer = layersets.value.downLayer = null;
        }, 10);
      },
      lower: function (layer, index) {
        imageryLayers.lower(toRaw(layer));
        layersets.value.upLayer =
          layersets.value.layers[Math.min(layersets.value.layers.length - 1, index + 1)];
        layersets.value.downLayer = layer;
        updateLayerList();
        window.setTimeout(function () {
          layersets.value.upLayer = layersets.value.downLayer = null;
        }, 10);
      },
      canRaise: function (layerIndex) {
        return layerIndex > this.tilelayers.length;
      },
      canLower: function (layerIndex) {
        return layerIndex >= this.tilelayers.length && layerIndex < (this.tilelayers.length+imageryLayers.length) - 1;
      },
    })

  function setupLayers() {
    // Create all the base layers that this example will support.
    // These base layers aren't really special.  It's possible to have multiple of them
    // enabled at once, just like the other layers, but it doesn't make much sense because
    // all of these layers cover the entire globe and are opaque.
    new Promise((resolve, reject) => {
      let res = addBaseLayerOption("OpenStreetMaps", new OpenStreetMapImageryProvider());
      resolve(res);
    }).then((res) => {
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

      addAdditionalLayerOption("Grid", new GridImageryProvider(), 1.0, false);
      addAdditionalLayerOption(
        "Tile Coordinates",
        new TileCoordinatesImageryProvider(),
        1.0,
        false,
      );
    });
  }

  async function addBaseLayerOption(name, imageryProviderPromise) {
    try {
      const imageryProvider = await Promise.resolve(imageryProviderPromise);
      const layer = new ImageryLayer(imageryProvider);
      layer.name = name;
      layersets.value.baseLayers.push(layer);
      updateLayerList();
      if (layersets.value.baseLayers.length===1){
        layersets.value.selectedLayer = layersets.value.baseLayers[0];
        baseLayerChange(0);
      }
      return layer;
    } catch (error) {
      console.error(`There was an error while creating ${name}. ${error}`);
    }
  }
  async function addTerrainLayerOption(name, terrainProviderPromise) {
      const layer = terrainProviderPromise
      layer.name = name;
      layersets.value.terrainLayers.push(layer);
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

      updateLayerList();
    } catch (error) {
      console.error(`There was an error while creating ${name}. ${error}`);
    }
  }

  function updateLayerList() {
    const numLayers = imageryLayers.length;
    layersets.value.imglayers.splice(0, layersets.value.imglayers.length);
    for (let i = numLayers - 1; i >= 0; --i) {
      layersets.value.imglayers.push(imageryLayers.get(i));
    }

    const numTileLayers = cs_viewer.scene.primitives.length;
    layersets.value.tilelayers.splice(0, layersets.value.tilelayers.length);
    for (let i = numTileLayers - 1; i >= 0; --i) {
      layersets.value.tilelayers.push(cs_viewer.scene.primitives.get(i));
    }

    layersets.value.layers.splice(0, layersets.value.layers.length);
    const imgL = toRaw(layersets.value.imglayers);
    const imgT = toRaw(layersets.value.tilelayers);
    layersets.value.layers=[...imgT, ...imgL];

    // console.log('layersets',layersets.value);
  }

// Cesium初始化
  async function initCesiumView(viewer,options) {
    // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
    viewer = new Viewer('cesiumContainer', {
      animation: false,
      baseLayerPicker: false,
      // fullscreenButton: false,
      // vrButton: false,
      geocoder: false,
      homeButton: true,
      // infoBox: false,
      sceneModePicker: true,
      // selectionIndicator: false,
      timeline: false,
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
// 取得Ion資源
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
            // console.log(`Loaded imagery asset: ${asset.name}`);
            break;

          case 'TERRAIN':
            addTerrainLayerOption(asset.name, CesiumTerrainProvider.fromIonAssetId(asset.id));
            // console.log(`Loaded terrain asset: ${asset.name}`);
            break;

          case '3DTILES':
            add3DTilesLayerOption(asset.name, asset.id, 1, false);
            // console.log(`Loaded 3D tileset asset: ${asset.name}`);
            break;

          default:
            console.log(`Unsupported asset type: ${asset.type}`);
        }
        
      });
      addTerrainLayerOption('無',new EllipsoidTerrainProvider());
      terrainLayerChange(0);
      // layersets.value.selectedLayer = layersets.value.baseLayers[0];
    })
    .catch(error => {
      console.error('Error fetching Ion assets:', error);
    });
  }

  watch(selectLayerIndex,(newVal)=>{
    baseLayerChange(newVal);
  });
  function baseLayerChange(baseLayerIndex) {
    // console.log('baseLayerIndex:',baseLayerIndex);
    // Handle changes to the drop-down base layer selector.
    const baseLayer = layersets.value.baseLayers[baseLayerIndex]?layersets.value.baseLayers[baseLayerIndex]:null;
    if(!baseLayer) return;

    let activeLayerIndex = 0;
    const numLayers = layersets.value.layers.length;
    for (let i = 0; i < numLayers; ++i) {
      if (layersets.value.isSelectableLayer(toRaw(layersets.value.layers[i]))) {
        activeLayerIndex = i;
        break;
      }
    }
    const activeLayer = toRaw(layersets.value.layers[activeLayerIndex]);
    const show = activeLayer.show;
    const alpha = activeLayer.alpha;
    imageryLayers.remove(activeLayer, false);
    imageryLayers.add(toRaw(baseLayer), numLayers - activeLayerIndex - 1);
    baseLayer.show = show;
    baseLayer.alpha = alpha;
    updateLayerList();
    return baseLayer;
  }
  watch(terrainLayerIndex,(newVal)=>{
    terrainLayerChange(newVal);
  });
  function terrainLayerChange(terrainLayerIndex) {
    // console.log('terrainLayerIndex:',terrainLayerIndex);

    // Handle changes to the drop-down base layer selector.
    const terrainLayer = layersets.value.terrainLayers[terrainLayerIndex]?layersets.value.terrainLayers[terrainLayerIndex]:null;
    if(!terrainLayer) return;
      cs_viewer.scene.setTerrain(
        new Terrain(toRaw(terrainLayer)),
      );
    // cs_viewer.scene.terrainProvider = toRaw(terrainLayer);
    return terrainLayer;
  }
  function createButton(){
    // 建立管理者登入按鈕
    const adminButton = document.createElement('button');
    adminButton.id = 'adminPage';
    adminButton.innerHTML = '<i class="fas fa-tools"></i>';
    adminButton.className = 'cesium-button cesium-toolbar-button';
    adminButton.title = '管理者登入';
    adminButton.onclick = function() {
      router.push("/logIn");
    };
    document.getElementsByClassName('cesium-viewer-toolbar')[0].appendChild(adminButton);
  }
  // 切換顯示圖層管理工具
  function showLayerManager(){
    const box = document.getElementById('layerManager');
    // layerManagerWidth.value = box.scrollWidth;
    if (box.classList.contains('toolvisible')){
      // console.log('隱藏:',box.style.width)
      box.classList.remove('toolvisible');
      box.style.width = 0;
      box.classList.add('toolhidden');
    }else{
      // console.log('顯示:',box.style.width)
      box.classList.remove('toolhidden');
      box.style.width = box.scrollWidth + 'px'; // 使用具體的內容寬度
      
      setTimeout(() => {
        box.classList.add('toolvisible');
      }, 10);
    }
  }
  // 切換顯示圖層加載工具
  function showLayerLoader(){
    const box = document.getElementById('layerloader');
    if (box.classList.contains('toolvisible')){
      // console.log('隱藏:',box.style.width)
      box.classList.remove('toolvisible');
      box.style.width = 0;
      box.classList.add('toolhidden');
      layerMGShow.value = false;
    }else{
      // console.log('顯示:',box.style.width)
      box.classList.remove('toolhidden');
      box.style.width = '20rem'; // 使用具體的內容寬度
      
      setTimeout(() => {
        box.classList.add('toolvisible');
        layerMGShow.value = true;
      }, 10);
    }
  }

  // 取得後端訊息
  const { mutate: getAlluser } = useMutation(UsersGQL.GETALLUSERs);
  async function getSettionFormGrphql() {
    let result = await getAlluser();
    console.log('result:',result);
  }
// 頁面渲染完成後執行步驟
  onMounted( async function () {
    getSettionFormGrphql();

    cs_viewer = await initCesiumView(cs_viewer,'');
    // console.log(cs_viewer);
    createButton();
    imageryLayers = cs_viewer.imageryLayers;
    setupLayers();
    getIonResouse();
  });

  
</script>

<template>
  <MDBContainer fluid class="h-100">
    <div id="cesiumContainer" class="border h-100 w-100">
      <!-- <div class="cursorH border-bottom border-danger"></div> -->
      <!-- <div class="cursorV border-end border-danger"></div> -->
    </div>
    <div id="loadingOverlay"><h1>Loading...</h1></div>
    
    <button title="加載圖層" class="layerMG cesium-button cesium-toolbar-button" @click.stop="showLayerLoader">
      <i v-if="layerMGShow" class="fas fa-folder-open"></i>
      <i v-else class="fas fa-folder-plus"></i>
    </button>
    <div id="toolbar">
      <div id="layerloader" class="toolhidden addTrans">
        <!-- 搜尋區塊 -->
        <div class="navbar navbar-dark bg-dark">
          <div id="layersearcher" class="container-fluid">
            <div class="d-flex input-group w-auto">
              <input
                type="search"
                class="form-control rounded"
                placeholder="Search"
                aria-label="Search"
                aria-describedby="search-addon"
              />
              <button class="input-group-text border-0" id="search-addon">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>
          <table class="d-none">
            <tbody class="border-top">
              <tr>
                <td>X</td>
                <td>XX</td>
                <td>X</td>
                <td>X</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 圖層加載區塊 -->
        <MDBAccordion v-model="activeItem" stayOpen>
          <MDBAccordionItem headerTitle="Accordion Item #1" collapseId="stayOpen-collapseOne">
            1
          </MDBAccordionItem>
          <MDBAccordionItem headerTitle="Accordion Item #2" collapseId="stayOpen-collapseTwo">
            2
          </MDBAccordionItem>
          <MDBAccordionItem headerTitle="Accordion Item #3" collapseId="stayOpen-collapseThree">
            3
          </MDBAccordionItem>
        </MDBAccordion>
      </div>
      <!-- 圖層管理區塊 -->
      <div class="align-self-start grid-container">
        <div id="layerManager" class="addTrans toolhidden">
          <div>
            <table>
              <tbody>
                <tr v-for="(layer, index) in  layersets.layers" 
                  :class="['align-items-center', (layer===layersets.upLayer)?'up':(layer===layersets.downLayer)?'down':'']">
                  <td class="col-auto"><span v-if="layersets.isSelectableLayer(layer)" class="me-2">底圖</span><input type="checkbox" v-model="layer.show"></td>
                  <td class="text-nowrap">
                    <div v-show="!layersets.isSelectableLayer(layer)">{{layer.name}}</div>
                    <select v-if="layersets.isSelectableLayer(layer)" v-model="selectLayerIndex">
                      <option v-for="(baseLayer, index) in layersets.baseLayers" :value="index">{{ baseLayer.name }}</option>
                    </select>
                  </td>
                  <td class="col-auto">
                    <input type="range" min="0" max="1" step="0.01" v-model="layer.alpha">
                  </td>
                  <td class="col-auto">
                    <button class="cesium-button" @click="layersets.raise(layer, index)" v-show="layersets.canRaise(index)">▲</button>
                  </td>
                  <td class="col-auto">
                    <button class="cesium-button" @click="layersets.lower(layer, index)" v-show="layersets.canLower(index)">▼</button>
                  </td>
                </tr>
                <tr>
                  <td>目前地形</td>
                  <td>
                    <select v-model="terrainLayerIndex">
                      <option v-for="(terrainL, index) in layersets.terrainLayers" :value="index">{{ terrainL.name }}</option>
                    </select>
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
    </div> 
  </MDBContainer>
</template>
<style scoped>
.navbar{
  border-radius: 4px;
  margin-bottom: 0.2rem;
}

#layersearcher{
  padding-bottom: var(--mdb-navbar-padding-y);
}

#cesiumContainer{
  height: calc(100% - var(--bottom-div));
  position: absolute;
  top: 0;
  left: 0;
}
.cursorH{
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 0;
  z-index: 100;
}

.cursorV{
  position: absolute;
  left: 50%;
  top: 0;
  width: 0;
  height: 100%;
  z-index: 100;
}
#toolbar {
  display: flex;
  color: white;
  position: absolute;
  max-width: calc(100% - 3rem);
  max-height: calc(100% - 150px);
  top: 3rem;
  left: 0.5rem;
  z-index: 2;
}

/* 圖層按鈕 */
.layerMG{
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  
}
/* 手風琴自訂樣式 */
.accordion{
  --mdb-accordion-border-radius:4px;
  --mdb-accordion-color: white;
  --mdb-accordion-bg: rgba(42, 42, 42, 0.8);
  --mdb-accordion-border-color: rgba(42, 42, 42, 0.8);
  --mdb-accordion-border-radius: 4px;
  --mdb-accordion-inner-border-radius: 4px;
  --mdb-accordion-btn-color: white;
  --mdb-accordion-btn-bg: rgba(42, 42, 42, 0.8);
  --mdb-accordion-active-color: white;
  --mdb-accordion-active-bg: rgba(42, 42, 42, 0.8); 
  text-wrap: nowrap;
}

/* 圖層管理加載工具 */
#layerloader{
  display: block;
  overflow: hidden;
  width: 0;
  margin-right: 0.2rem;

}

/* 圖層管理工具 */
/* 外包容器設定 */
.grid-container{
  display: grid;
  grid-template-rows: auto auto; /* 自動高度的兩行 */
  position: relative; /* 使子元素可以使用絕對定位 */
}
#layerManager{
  width: 0;
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

table tr > td:nth-child(1),
table tr > td:nth-child(2){
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

/* 收合動畫效果 */
.addTrans{
  transition: width 0.5s ease; /* 添加過渡效果 */
}

#layerManager:after{
  content: '';
  display: block;
  height: 100%; /* 繼承 layerManager 的高度 */
}
/* 圖層收合開關 */
#hiddenBtn {
  display: flex;
  align-items: center; /* 垂直置中 */
  justify-content: center; /* 水平置中 */
  position: absolute;
  margin: 0;
  padding: 0;
  min-height: 3rem;
  top: 1rem;
  right: -1rem;
  height: calc(100% - 2rem);
  width: 1rem;
  background-color: rgba(42, 42, 42, 0.8);
  border-radius: 0 0.5rem 0.5rem 0;
  
}

#hiddenBtn:focus,td>button:focus {
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