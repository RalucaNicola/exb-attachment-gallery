
/** @jsx jsx */

import { AllWidgetProps, jsx, FeatureLayerDataSource, SqlQueryParams, DataSourceManager, WidgetProps, DataSourceComponent, FeatureLayerQueryParams, DataSource, DataSourceStatus, DataRecordsSelectionChangeMessage, MessageManager, DataSourceTypes } from "jimu-core";
import { setDataSourcePreloadData } from "jimu-core/lib/app-actions";
import { styled } from "jimu-theme";
import { Button, Loading, LoadingType, WidgetPlaceholder } from "jimu-ui";
import { useEffect, useRef, useState } from "react";
import { ImageCard } from "./components/image-card";
const alertIcon = require("./assets/alert.svg");
import defaultMessages from "./translations/default";
import { formatDate } from "./utils/utils";

const pageSize = 100;



const Container = styled.div`
  height: 100%;
`;

const Gallery = styled.div`
  height: calc(100% - 15px);
  display: flex;
  gap: 2rem;
  overflow-x: auto;
  mouse-wheel:horizontal;
`;


export default function (props: AllWidgetProps<WidgetProps>) {

  const [sortField, setSortField] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [dataSource, setDataSource] = useState(null);
  const [records, setRecords] = useState([]);
  const [count, setCount] = useState(null);


  useEffect(() => {
    if (dataSource) {
      let sortField = null;
      const queryParams = dataSource.getCurrentQueryParams();
      if (queryParams.orderByFields && queryParams.orderByFields.length > 0) {
        sortField = queryParams.orderByFields[0].split(" ")[0];
        setSortField(sortField);
      }
      dataSource.query({ outFields: ["objectid", "Title", sortField], returnGeometry: true }).then(result => {
        setCount(result.records.length);
        setRecords(result.records);
      });
    }
  }, [dataSource]);

  const dsConfigured = props.useDataSources && props.useDataSources.length > 0;

  const scrollIntoView = id => {
    const galleryNode = galleryRef.current;
    const selectedNode = galleryNode.querySelector(`[data-id='${id}']`);
    selectedNode.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    })
  }

  // no info about data source
  const handleDsInfoChange = (info) => {
    if (info.selectedIds && info.selectedIds.length > 0 && info.selectedIds[0] !== selectedId) {
      setSelectedId(info.selectedIds[0]);
      scrollIntoView(info.selectedIds[0]);
    }
  }

  // this gets called only once and the records are still loading in the data
  const handleDsCreated = (ds: FeatureLayerDataSource) => {
    if (ds) {
      setDataSource(ds);
    }
  }

  const dataRender = (ds: FeatureLayerDataSource) => {
    return (
      records ?
        <Container> <Gallery ref={galleryRef}>
          {records.map((record) => {
            const recordId = record.getId();
            return (
              <ImageCard
                record={record}
                selected={selectedId === recordId}
                onClick={() => {
                  ds.selectRecordById(recordId);
                  MessageManager.getInstance().publishMessage(new DataRecordsSelectionChangeMessage(props.id, [record]));
                }}
                sortField={sortField}
                addRecord={(record) => {
                  const sourceRecords = ds.getSourceRecords();
                  ds.setSourceRecords(sourceRecords.concat([record]));
                  console.log(sourceRecords.length);
                }}
              ></ImageCard>
            )
          })})
        </Gallery>
          {ds.lastRefreshTime ? <p>
            {count} features last updated at {formatDate(ds.lastRefreshTime)}</p> : <div></div>}
        </Container>
        :
        <Loading type={LoadingType.Secondary}></Loading>)
  }

  return (
    <div className="widget-get-map-coordinates jimu-widget p-2">
      {dsConfigured ?
        (<DataSourceComponent
          useDataSource={props.useDataSources[0]}
          onDataSourceInfoChange={handleDsInfoChange}
          onDataSourceCreated={handleDsCreated}
          widgetId={props.id}
        >
          {dataRender}
        </DataSourceComponent>)
        :
        (<WidgetPlaceholder icon={alertIcon} message={defaultMessages.chooseSource}>
        </WidgetPlaceholder>)}
    </div>
  )
}