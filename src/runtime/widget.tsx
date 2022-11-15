
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
  const [dataSource, setDataSource] = useState(null);
  const { useDataSources } = props;

  // query for new data only when the data source changes
  useEffect(() => {
    if (useDataSources && useDataSources.length > 0) {
      const dsManager = DataSourceManager.getInstance();
      const ds: FeatureLayerDataSource = dsManager.getDataSource(useDataSources[0].dataSourceId) as FeatureLayerDataSource;
      if (ds && ds.layer) {
        setDataSource(ds);
        Promise.all([
          ds.layer.queryAttachments({ where: "1=1" }),
          ds.layer.queryFeatures({ where: "1=1", outFields: ["CreationDate", "objectid"], orderByFields: ["CreationDate DESC"] })
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
          setAttachments(attachmentList);
        })
          .catch((error) => { setAttachments(null); throw (error); })
      } else {
        setDataSource(null);
      }
    } else {
      setAttachments(null);
    }
  }, [useDataSources]);

  const selectRecord = (id) => {
    dataSource.selectRecordById(id);
  }

  return (
    <div className="widget-get-map-coordinates jimu-widget p-2">
      {attachments ?
        (<Gallery>
          {attachments.slice(0, 10).map((attachment) => {
            return (<Image src={attachment.url} onClick={() => selectRecord(attachment.featureid)}></Image>)
          })
          }
        </Gallery>)
        :
        (<WidgetPlaceholder icon={alertIcon} message={defaultMessages.chooseSource}>
        </WidgetPlaceholder>)}
    </div>
  )
}