
/** @jsx jsx */

import { AllWidgetProps, jsx, FeatureLayerDataSource, SqlQueryParams, DataSourceManager, WidgetProps } from "jimu-core";
import { styled } from "jimu-theme";
import { WidgetPlaceholder } from "jimu-ui";
import { useEffect, useState } from "react";

const alertIcon = require("./assets/alert.svg");
import defaultMessages from "./translations/default";

const Gallery = styled.div`
  height: 100%;
  display: flex;
  overflow-x: auto;
  gap: 2rem;
`;

const Image = styled.img`
  height: 100%;
`;

export default function (props: AllWidgetProps<WidgetProps>) {

  const [attachments, setAttachments] = useState(null);
  const { useDataSources } = props;

  // query for new data only when the data source changes
  useEffect(() => {
    if (useDataSources && useDataSources.length > 0) {
      const dsManager = DataSourceManager.getInstance();
      const dataSource: FeatureLayerDataSource = dsManager.getDataSource(useDataSources[0].dataSourceId) as FeatureLayerDataSource;
      if (dataSource && dataSource.layer) {
        console.log("Running queries");
        Promise.all([
          dataSource.layer.queryAttachments({ where: "1=1" }),
          dataSource.layer.queryFeatures({ where: "1=1", outFields: ["CreationDate", "objectid"], orderByFields: ["CreationDate DESC"] })
        ]).then(results => {
          const [attachmentResults, featureResults] = results;
          let attachmentList = [];
          featureResults.features.map(feature => {
            const { objectid: featureid, CreationDate: date } = feature.attributes;
            if (attachmentResults.hasOwnProperty(featureid)) {
              const { id, url, size } = attachmentResults[featureid][0];
              attachmentList.push({ id, featureid, url, size, date });
            }
          });
          console.log(attachmentList);
          setAttachments(attachmentList);
        })
          .catch((error) => { setAttachments(null); throw (error); })
      }
    } else {
      setAttachments(null);
    }
  }, [useDataSources]);


  return (
    <div className="widget-get-map-coordinates jimu-widget p-2">
      {attachments ?
        (<Gallery>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
            return (<Image src={attachments[i].url}></Image>)
          })
          }
        </Gallery>)
        :
        (<WidgetPlaceholder icon={alertIcon} message={defaultMessages.chooseSource}>
        </WidgetPlaceholder>)}
    </div>
  )
}