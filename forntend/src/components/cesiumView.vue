<script setup>
  import { 
    ref, reactive, onMounted, 
    provide, inject, watch,
    isProxy, toRaw 
  } from "vue";

  import { 
    Cartesian3, 
    Cesium3DTileStyle,
    createOsmBuildingsAsync, 
    Cesium3DTileset, 
    Ion, Math as CesiumMath, 
    Terrain, Viewer,
    RequestScheduler,
    viewerCesium3DTilesInspectorMixin 
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
    // The URL on your server where CesiumJS's static files are hosted.
    window.CESIUM_BASE_URL = '/Cesium';
    
    // Your access token can be found at: https://ion.cesium.com/tokens.
    // Replace `your_access_token` with your Cesium ion access token.
    const cesium_token = ref(import.meta.env.VITE_CESIUM_Token);
    Ion.defaultAccessToken = cesium_token.value;

    let cs_viewer;
    let cs_camera;
    onMounted(function () {
      // Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
      cs_viewer = new Viewer('cesiumContainer', {
        animation: true,
        baseLayerPicker: true,
        // fullscreenButton: false,
        // vrButton: false,
        geocoder: false,
        // homeButton: false,
        // infoBox: false,
        sceneModePicker: false,
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
        terrain: Terrain.fromWorldTerrain(),
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
      // cs_viewer.bottomContainer.style.display = "none";
      // cs_camera = cs_viewer.camera;

      // cs_viewer.extend(viewerCesium3DTilesInspectorMixin);
      // const inspectorViewModel = cs_viewer.cesium3DTilesInspector.viewModel;

      // 顯示FTS視窗
      // cs_viewer.scene.debugShowFramesPerSecond = true;
      // cs_camera.upWC.x
      // Fly the camera to San Francisco at the given longitude, latitude, and height.
      // cs_camera.flyTo({
      //   // destination: Cartesian3.fromDegrees(120.6638, 24.147, 2000),
      //   destination: Cartesian3.fromDegrees(121,24,100000),
      //   // orientation: {
      //   //   heading: CesiumMath.toRadians(0.0),
      //   //   pitch: CesiumMath.toRadians(-85.0),
      //   // }
      // });
      
      // Add Cesium OSM Buildings, a global 3D buildings layer.
      // createOsmBuildingsAsync().then((buildingTileset)=>{
      //   cs_viewer.scene.primitives.add(buildingTileset);   
      // })
      // Cesium3DTileset.fromUrl("https://tile.googleapis.com/v1/3dtiles/root.json?key=" + google_token.value).then(tileset=>{
      //   viewer.scene.primitives.add(tileset); 
      // });
      // 自動遮蔽低於地形高度的模型
      // cs_viewer.scene.globe.depthTestAgainstTerrain = true;
      // Cesium3DTileset.fromUrl("/samples/outline/utrecht/tileset.json").then(tileset=>{
      //   cs_viewer.scene.primitives.add(tileset);
      //   cs_viewer.zoomTo(tileset);
      //   // cs_camera.flyTo({
      //   //   destination: Cartesian3.fromDegrees(121,24,100000),
      //   // })
      // });

    });

</script>

<template>
  <MDBContainer fluid class="h-100">
    <div id="cesiumContainer" class="border h-100 w-100">
      <div class="cursorH border-bottom border-danger"></div>
      <div class="cursorV border-end border-danger"></div>
    </div>
  </MDBContainer>
</template>
<style scoped>
#cesiumContainer {
  position: absolute;
  top: 0;
  left: 0;
}
</style>