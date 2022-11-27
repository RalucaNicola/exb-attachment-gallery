
/** @jsx jsx */

import { AllWidgetProps, jsx, FeatureLayerDataSource, SqlQueryParams, DataSourceManager, WidgetProps, DataSourceComponent, FeatureLayerQueryParams, DataSource, DataSourceStatus, DataRecordsSelectionChangeMessage, MessageManager, DataSourceTypes } from "jimu-core";
import { setDataSourcePreloadData } from "jimu-core/lib/app-actions";
import { styled } from "jimu-theme";
import { Button, Loading, LoadingType, WidgetPlaceholder } from "jimu-ui";
import { useEffect, useRef, useState } from "react";
const alertIcon = require("./assets/alert.svg");
import defaultMessages from "./translations/default";

const pageSize = 100;

const formatDate = (ms) => {
  const date = new Date(ms);
  return new Intl.DateTimeFormat('ca-iso8601', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
}

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

const ImageContainer = styled.div`
  position: relative;
`;

const ImageCaption = styled.p`
  position: absolute;
  bottom: 3px;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.6);
  color: black;
  text-align: center;
  padding: 10px 5px;
`

const Image = styled.img`
  height: 100%;
  min-width: 200px;
`;

export default function (props: AllWidgetProps<WidgetProps>) {

  const [recsWithAttach, setRecsWithAttach] = useState(null);
  const [loadedDS, setLoadedDS] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const galleryRef = useRef<HTMLDivElement>(null);

  const dsConfigured = props.useDataSources && props.useDataSources.length > 0;

  const getAttachments = (records) => {
    Promise.all(records.map((r) => r.queryAttachments()))
      .then(() => {
        setRecsWithAttach(records);
      })
  }

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
  const handleDsInfoChange = (info, preinfo) => {
    // console.log("Data source status on info change", info);
    if (info.selectedIds && info.selectedIds.length > 0 && info.selectedIds !== selectedId) {
      console.log(info);
      setSelectedId(info.selectedIds[0]);
      scrollIntoView(info.selectedIds[0]);
    }
  }

  // this gets called only once and the records are still loading in the data
  const handleDsCreated = (ds: FeatureLayerDataSource) => {
    // console.log("Data source status after creation", ds);
    if (ds) {
      const queryParams = ds.getCurrentQueryParams();
      if (queryParams.orderByFields && queryParams.orderByFields.length > 0) {
        setSortField(queryParams.orderByFields[0].split(" ")[0]);
      }
    }
  }

  const dataRender = (ds: DataSource) => {
    console.log("Data source status from data render", ds.getStatus(), loadedDS);
    if (ds && ds.getStatus() === DataSourceStatus.Loaded) {
      setLoadedDS(true);
      if (!loadedDS) {
        //const recs = ds.getRecordsByPage(currentPage, pageSize);
        const recs = ds.getRecords();
        console.log("Re-rendering images", recs);
        getAttachments(recs);
      }
    } else {
      setLoadedDS(false);
    }
    return (
      recsWithAttach ? <Container> <Gallery ref={galleryRef}>
        {recsWithAttach.map((r) => {
          const recordId = r.getId();
          return (
            <ImageContainer
              key={recordId}
              data-id={recordId}
              style={selectedId === recordId ? { border: "3px solid rgba(0, 0, 255, 0.4)" } : {}}
            >
              <Image
                src={r.attachmentInfos[0].url}
                onClick={() => {
                  ds.selectRecordById(recordId);
                  MessageManager.getInstance().publishMessage(new DataRecordsSelectionChangeMessage(props.id, [r]));
                }}
              ></Image>
              <ImageCaption>Last created: {formatDate(r.feature.attributes[sortField])}</ImageCaption>
            </ImageContainer>
          )
        })}

      </Gallery><p>Last updated: {formatDate(ds.lastRefreshTime)}</p></Container> :
        <Loading type={LoadingType.Secondary}></Loading>
    )
  }

  return (
    <div className="widget-get-map-coordinates jimu-widget p-2">
      {dsConfigured ?
        (<DataSourceComponent
          useDataSource={props.useDataSources[0]}
          query={{ returnGeometry: true, pageSize } as FeatureLayerQueryParams}
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