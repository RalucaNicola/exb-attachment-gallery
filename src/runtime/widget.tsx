
/** @jsx jsx */

import { AllWidgetProps, jsx, FeatureLayerDataSource, SqlQueryParams, DataSourceManager, WidgetProps, DataSourceComponent, FeatureLayerQueryParams, DataSource, DataSourceStatus, DataRecordsSelectionChangeMessage, MessageManager, DataSourceTypes } from "jimu-core";
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

  const dsConfigured = props.useDataSources && props.useDataSources.length > 0;

  // query for new data only when the data source changes
  const handleDsInfoChange = (evt) => {
    console.log("Data source info changed", evt);
  }

  const handleDsCreated = (ds: FeatureLayerDataSource) => {
    if (ds) {
      console.log("Data records", ds.getRecords());
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
    }
  }

  const dataRender = (ds: DataSource) => {
    // here ds.getRecords() returns 100 records
    // if (ds && ds.getStatus() === DataSourceStatus.Loaded) {
    //   const records = ds.getRecords();
    //   records.forEach((r) => {
    //     console.log(r, r.getId())
    //   });
    // }
    return (
      attachments && ds.getStatus() === DataSourceStatus.Loaded ? <Gallery>
        {attachments.slice(0, 10).map((attachment) => {
          return (<Image src={attachment.url} onClick={() => {
            const id = attachment.featureid.toString();
            // here ds.getRecords() returns an empty array and ds.getRecordById(id) will return undefined
            console.log("selected feature", ds.getRecordById(id));
            //ds.selectRecordById(attachment.featureid.toString())
            MessageManager.getInstance().publishMessage(new DataRecordsSelectionChangeMessage(props.id, [ds.getRecordById(id)]))
          }}></Image>)
        })})
      </Gallery> : <div>Loading...</div>
    )

  }

  return (
    <div className="widget-get-map-coordinates jimu-widget p-2">
      {dsConfigured ?
        (<DataSourceComponent useDataSource={props.useDataSources[0]} query={{ where: '1=1' } as FeatureLayerQueryParams} onDataSourceInfoChange={handleDsInfoChange} onDataSourceCreated={handleDsCreated} widgetId={props.id}>
          {dataRender}
        </DataSourceComponent>)
        :
        (<WidgetPlaceholder icon={alertIcon} message={defaultMessages.chooseSource}>
        </WidgetPlaceholder>)}
    </div>
  )
}