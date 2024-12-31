import gql from "graphql-tag";

const GETLAYERSETTINS = gql`
  mutation GetLayerSettins {
    getLayerSettins {
      variable
      value
    }
  }
`;

const GETALLLAYERS = gql`
  mutation GetAllLayers {
    getAllLayers {
      id
      name
      class_type
      source_type
      link_info
      layer_type
      load_setting
      enable
    }
  }
`;

export default {
  GETLAYERSETTINS,
  GETALLLAYERS,
};