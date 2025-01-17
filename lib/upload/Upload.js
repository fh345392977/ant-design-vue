'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UploadProps = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _uniqBy = require('lodash/uniqBy');

var _uniqBy2 = _interopRequireDefault(_uniqBy);

var _findIndex = require('lodash/findIndex');

var _findIndex2 = _interopRequireDefault(_findIndex);

var _vcUpload = require('../vc-upload');

var _vcUpload2 = _interopRequireDefault(_vcUpload);

var _BaseMixin = require('../_util/BaseMixin');

var _BaseMixin2 = _interopRequireDefault(_BaseMixin);

var _propsUtil = require('../_util/props-util');

var _LocaleReceiver = require('../locale-provider/LocaleReceiver');

var _LocaleReceiver2 = _interopRequireDefault(_LocaleReceiver);

var _default2 = require('../locale-provider/default');

var _default3 = _interopRequireDefault(_default2);

var _configProvider = require('../config-provider');

var _Dragger = require('./Dragger');

var _Dragger2 = _interopRequireDefault(_Dragger);

var _UploadList = require('./UploadList');

var _UploadList2 = _interopRequireDefault(_UploadList);

var _interface = require('./interface');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports.UploadProps = _interface.UploadProps;
exports['default'] = {
  name: 'AUpload',
  mixins: [_BaseMixin2['default']],
  inheritAttrs: false,
  Dragger: _Dragger2['default'],
  props: (0, _propsUtil.initDefaultProps)(_interface.UploadProps, {
    type: 'select',
    multiple: false,
    action: '',
    data: {},
    accept: '',
    beforeUpload: _utils.T,
    showUploadList: true,
    listType: 'text', // or pictrue
    disabled: false,
    supportServerRender: true
  }),
  inject: {
    configProvider: { 'default': function _default() {
        return _configProvider.ConfigConsumerProps;
      } }
  },
  // recentUploadStatus: boolean | PromiseLike<any>;
  data: function data() {
    this.progressTimer = null;
    return {
      sFileList: this.fileList || this.defaultFileList || [],
      dragState: 'drop'
    };
  },

  watch: {
    fileList: function fileList(val) {
      this.sFileList = val || [];
    }
  },
  beforeDestroy: function beforeDestroy() {
    this.clearProgressTimer();
  },

  methods: {
    onStart: function onStart(file) {
      var targetItem = (0, _utils.fileToObject)(file);
      targetItem.status = 'uploading';
      var nextFileList = this.sFileList.concat();
      var fileIndex = (0, _findIndex2['default'])(nextFileList, function (_ref) {
        var uid = _ref.uid;
        return uid === targetItem.uid;
      });
      if (fileIndex === -1) {
        nextFileList.push(targetItem);
      } else {
        nextFileList[fileIndex] = targetItem;
      }
      this.onChange({
        file: targetItem,
        fileList: nextFileList
      });
      // fix ie progress
      if (!window.FormData) {
        this.autoUpdateProgress(0, targetItem);
      }
    },
    autoUpdateProgress: function autoUpdateProgress(_, file) {
      var _this = this;

      var getPercent = (0, _utils.genPercentAdd)();
      var curPercent = 0;
      this.clearProgressTimer();
      this.progressTimer = setInterval(function () {
        curPercent = getPercent(curPercent);
        _this.onProgress({
          percent: curPercent * 100
        }, file);
      }, 200);
    },
    onSuccess: function onSuccess(response, file) {
      this.clearProgressTimer();
      try {
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
      } catch (e) {
        /* do nothing */
      }
      var fileList = this.sFileList;
      var targetItem = (0, _utils.getFileItem)(file, fileList);
      // removed
      if (!targetItem) {
        return;
      }
      targetItem.status = 'done';
      targetItem.response = response;
      this.onChange({
        file: (0, _extends3['default'])({}, targetItem),
        fileList: fileList
      });
    },
    onProgress: function onProgress(e, file) {
      var fileList = this.sFileList;
      var targetItem = (0, _utils.getFileItem)(file, fileList);
      // removed
      if (!targetItem) {
        return;
      }
      targetItem.percent = e.percent;
      this.onChange({
        event: e,
        file: (0, _extends3['default'])({}, targetItem),
        fileList: this.sFileList
      });
    },
    onError: function onError(error, response, file) {
      this.clearProgressTimer();
      var fileList = this.sFileList;
      var targetItem = (0, _utils.getFileItem)(file, fileList);
      // removed
      if (!targetItem) {
        return;
      }
      targetItem.error = error;
      targetItem.response = response;
      targetItem.status = 'error';
      this.onChange({
        file: (0, _extends3['default'])({}, targetItem),
        fileList: fileList
      });
    },
    onReject: function onReject(fileList) {
      this.$emit('reject', fileList);
    },
    handleRemove: function handleRemove(file) {
      var _this2 = this;

      var remove = this.remove;
      var status = file.status;

      file.status = 'removed'; // eslint-disable-line

      Promise.resolve(typeof remove === 'function' ? remove(file) : remove).then(function (ret) {
        // Prevent removing file
        if (ret === false) {
          file.status = status;
          return;
        }

        var removedFileList = (0, _utils.removeFileItem)(file, _this2.sFileList);
        if (removedFileList) {
          _this2.onChange({
            file: file,
            fileList: removedFileList
          });
        }
      });
    },
    handleDownload: function handleDownload(file) {
      var anchor = document.createElement('a');
      anchor.setAttribute('href', file.url);
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('download', file.name);
      anchor.click();
    },
    handleManualRemove: function handleManualRemove(file) {
      if (this.$refs.uploadRef) {
        this.$refs.uploadRef.abort(file);
      }
      this.handleRemove(file);
    },
    onChange: function onChange(info) {
      if (!(0, _propsUtil.hasProp)(this, 'fileList')) {
        this.setState({ sFileList: info.fileList });
      }
      this.$emit('change', info);
    },
    onFileDrop: function onFileDrop(e) {
      this.setState({
        dragState: e.type
      });
    },
    reBeforeUpload: function reBeforeUpload(file, fileList) {
      if (!this.beforeUpload) {
        return true;
      }
      var result = this.beforeUpload(file, fileList);
      if (result === false) {
        this.onChange({
          file: file,
          fileList: (0, _uniqBy2['default'])(this.sFileList.concat(fileList.map(_utils.fileToObject)), function (item) {
            return item.uid;
          })
        });
        return false;
      }
      if (result && result.then) {
        return result;
      }
      return true;
    },
    clearProgressTimer: function clearProgressTimer() {
      clearInterval(this.progressTimer);
    },
    renderUploadList: function renderUploadList(locale) {
      var h = this.$createElement;

      var _getOptionProps = (0, _propsUtil.getOptionProps)(this),
          _getOptionProps$showU = _getOptionProps.showUploadList,
          showUploadList = _getOptionProps$showU === undefined ? {} : _getOptionProps$showU,
          listType = _getOptionProps.listType;

      var showRemoveIcon = showUploadList.showRemoveIcon,
          showPreviewIcon = showUploadList.showPreviewIcon,
          showDownloadIcon = showUploadList.showDownloadIcon;

      var uploadListProps = {
        props: {
          listType: listType,
          items: this.sFileList,
          showRemoveIcon: showRemoveIcon,
          showDownloadIcon: showDownloadIcon,
          showPreviewIcon: showPreviewIcon,
          locale: (0, _extends3['default'])({}, locale, this.$props.locale)
        },
        on: {
          remove: this.handleManualRemove,
          download: this.handleDownload
        }
      };
      if (this.$listeners.preview) {
        uploadListProps.on.preview = this.$listeners.preview;
      }
      return h(_UploadList2['default'], uploadListProps);
    }
  },
  render: function render() {
    var _classNames2;

    var h = arguments[0];

    var _getOptionProps2 = (0, _propsUtil.getOptionProps)(this),
        customizePrefixCls = _getOptionProps2.prefixCls,
        showUploadList = _getOptionProps2.showUploadList,
        listType = _getOptionProps2.listType,
        type = _getOptionProps2.type,
        disabled = _getOptionProps2.disabled;

    var getPrefixCls = this.configProvider.getPrefixCls;
    var prefixCls = getPrefixCls('upload', customizePrefixCls);

    var vcUploadProps = {
      props: (0, _extends3['default'])({}, this.$props, {
        prefixCls: prefixCls,
        beforeUpload: this.reBeforeUpload
      }),
      on: {
        // ...this.$listeners,
        start: this.onStart,
        error: this.onError,
        progress: this.onProgress,
        success: this.onSuccess,
        reject: this.onReject
      },
      ref: 'uploadRef',
      attrs: this.$attrs
    };

    var uploadList = showUploadList ? h(_LocaleReceiver2['default'], {
      attrs: {
        componentName: 'Upload',
        defaultLocale: _default3['default'].Upload
      },
      scopedSlots: { 'default': this.renderUploadList }
    }) : null;

    var children = this.$slots['default'];

    if (type === 'drag') {
      var _classNames;

      var dragCls = (0, _classnames2['default'])(prefixCls, (_classNames = {}, (0, _defineProperty3['default'])(_classNames, prefixCls + '-drag', true), (0, _defineProperty3['default'])(_classNames, prefixCls + '-drag-uploading', this.sFileList.some(function (file) {
        return file.status === 'uploading';
      })), (0, _defineProperty3['default'])(_classNames, prefixCls + '-drag-hover', this.dragState === 'dragover'), (0, _defineProperty3['default'])(_classNames, prefixCls + '-disabled', disabled), _classNames));
      return h('span', [h(
        'div',
        {
          'class': dragCls,
          on: {
            'drop': this.onFileDrop,
            'dragover': this.onFileDrop,
            'dragleave': this.onFileDrop
          }
        },
        [h(
          _vcUpload2['default'],
          vcUploadProps,
          [h(
            'div',
            { 'class': prefixCls + '-drag-container' },
            [children]
          )]
        )]
      ), uploadList]);
    }

    var uploadButtonCls = (0, _classnames2['default'])(prefixCls, (_classNames2 = {}, (0, _defineProperty3['default'])(_classNames2, prefixCls + '-select', true), (0, _defineProperty3['default'])(_classNames2, prefixCls + '-select-' + listType, true), (0, _defineProperty3['default'])(_classNames2, prefixCls + '-disabled', disabled), _classNames2));

    // Remove id to avoid open by label when trigger is hidden
    // https://github.com/ant-design/ant-design/issues/14298
    if (!children) {
      delete vcUploadProps.props.id;
    }

    var uploadButton = h(
      'div',
      { 'class': uploadButtonCls, style: children ? undefined : { display: 'none' } },
      [h(
        _vcUpload2['default'],
        vcUploadProps,
        [children]
      )]
    );

    if (listType === 'picture-card') {
      return h('span', [uploadList, uploadButton]);
    }
    return h('span', [uploadButton, uploadList]);
  }
};