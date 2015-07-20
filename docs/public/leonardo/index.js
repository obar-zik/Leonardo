$traceurRuntime.options.symbols = true;
var $__index_46_js__ = (function() {
  "use strict";
  var __moduleName = "index.js";
  var $__default = angular.module('example', ['leonardo']).run(run);
  function run($rootScope, configuration) {
    configuration.addStates([{
      name: 'state_animals_non_ajax',
      options: [{
        name: 'get kittens',
        data: ["persion", "siemi"]
      }, {
        name: 'get dogs',
        data: ["labrador"]
      }]
    }, {
      name: 'state1',
      url: 'http://url1.com',
      options: [{
        name: 'get url1 aaaa',
        status: 200,
        data: ["url1 aaa"]
      }, {
        name: 'get url1 bbbb',
        status: 200,
        data: ["url1 bbb"]
      }, {
        name: 'get url1 cccc',
        status: 200,
        data: ["url1 ccc"]
      }]
    }, {
      name: "state2",
      url: 'http://url2.com',
      options: [{
        name: 'get url2 bbbb',
        status: 404,
        data: ["url2 404 failure"]
      }]
    }, {
      name: "state3",
      url: 'http://url3.com',
      options: [{
        name: 'get url3 bbbb with delay',
        status: 200,
        data: ["url3 bbb"],
        delay: 2000
      }]
    }, {
      name: "state 4",
      options: [{
        name: 'get url4 bbbb',
        data: ["url4 bbb"]
      }]
    }]);
    $rootScope.showAnimals = function() {
      var option = configuration.getState("state_animals_non_ajax");
      alert(option ? option.data : 'No Active');
    };
  }
  return {get default() {
      return $__default;
    }};
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGNBQWMsUUFBUSxRQUFRLEVBQUksS0FBRyxDQUFBOzs7QUFBckMsQUFBSSxJQUFBLENBQUEsWUFBVyxhQUFvQixDQUFDO0FBQXBDLEFBQUksSUFBQSxDQUFBLFVBQVMsRUNLRSxDQUFBLE9BQU0sT0FBTyxBQUFDLENBQUMsU0FBUSxDQUFHLEVBQUMsVUFBUyxDQUFDLENBQUMsSUFDdEMsQUFBQyxDQUFDLEdBQUUsQ0FBQyxBQU5hLENBQUE7QUFTakMsU0FBUyxJQUFFLENBQUUsVUFBUyxDQUFHLENBQUEsYUFBWSxDQUFFO0FBTXJDLGdCQUFZLFVBQVUsQUFBQyxDQUFDLENBQ3RCO0FBQ0UsU0FBRyxDQUFHLHlCQUF1QjtBQUM3QixZQUFNLENBQUcsRUFDUDtBQUFDLFdBQUcsQ0FBRyxjQUFZO0FBQUcsV0FBRyxDQUFHLEVBQUMsU0FBUSxDQUFHLFFBQU0sQ0FBQztBQUFBLE1BQUMsQ0FDaEQ7QUFBQyxXQUFHLENBQUcsV0FBUztBQUFHLFdBQUcsQ0FBRyxFQUFDLFVBQVMsQ0FBQztBQUFBLE1BQUMsQ0FDdkM7QUFBQSxJQUNGLENBQ0E7QUFDRSxTQUFHLENBQUcsU0FBTztBQUNiLFFBQUUsQ0FBRyxrQkFBZ0I7QUFDckIsWUFBTSxDQUFHLEVBQ1A7QUFBQyxXQUFHLENBQUcsZ0JBQWM7QUFBRyxhQUFLLENBQUcsSUFBRTtBQUFHLFdBQUcsQ0FBRyxFQUFDLFVBQVMsQ0FBQztBQUFBLE1BQUMsQ0FDdkQ7QUFBQyxXQUFHLENBQUcsZ0JBQWM7QUFBRyxhQUFLLENBQUcsSUFBRTtBQUFJLFdBQUcsQ0FBRyxFQUFDLFVBQVMsQ0FBQztBQUFBLE1BQUMsQ0FDeEQ7QUFBQyxXQUFHLENBQUcsZ0JBQWM7QUFBRyxhQUFLLENBQUcsSUFBRTtBQUFJLFdBQUcsQ0FBRyxFQUFDLFVBQVMsQ0FBQztBQUFBLE1BQUMsQ0FDMUQ7QUFBQSxJQUNGLENBQ0E7QUFDRSxTQUFHLENBQUcsU0FBTztBQUNiLFFBQUUsQ0FBRyxrQkFBZ0I7QUFDckIsWUFBTSxDQUFHLEVBQ1A7QUFBQyxXQUFHLENBQUcsZ0JBQWM7QUFBRyxhQUFLLENBQUcsSUFBRTtBQUFJLFdBQUcsQ0FBRyxFQUFDLGtCQUFpQixDQUFDO0FBQUEsTUFBQyxDQUNsRTtBQUFBLElBQ0YsQ0FDQTtBQUNFLFNBQUcsQ0FBRyxTQUFPO0FBQ2IsUUFBRSxDQUFHLGtCQUFnQjtBQUNyQixZQUFNLENBQUcsRUFDUDtBQUFDLFdBQUcsQ0FBRywyQkFBeUI7QUFBRyxhQUFLLENBQUcsSUFBRTtBQUFJLFdBQUcsQ0FBRyxFQUFDLFVBQVMsQ0FBQztBQUFHLFlBQUksQ0FBRyxLQUFHO0FBQUEsTUFBQyxDQUNsRjtBQUFBLElBQ0YsQ0FDQTtBQUNFLFNBQUcsQ0FBRyxVQUFRO0FBQ2QsWUFBTSxDQUFHLEVBQ1A7QUFBQyxXQUFHLENBQUcsZ0JBQWM7QUFBRyxXQUFHLENBQUcsRUFBQyxVQUFTLENBQUM7QUFBQSxNQUFDLENBQzVDO0FBQUEsSUFDRixDQUNGLENBQUMsQ0FBQztBQVNGLGFBQVMsWUFBWSxFQUFJLFVBQVMsQUFBRCxDQUFFO0FBQ2pDLEFBQUksUUFBQSxDQUFBLE1BQUssRUFBSSxDQUFBLGFBQVksU0FBUyxBQUFDLENBQUMsd0JBQXVCLENBQUMsQ0FBQztBQUM3RCxVQUFJLEFBQUMsQ0FBQyxNQUFLLEVBQUksQ0FBQSxNQUFLLEtBQUssRUFBSSxZQUFVLENBQUUsQ0FBQztJQUM1QyxDQUFDO0VBQ0g7QUFBQSxBQWpFQSxTQUFBLGFBQXdCO0FBQUUsdUJBQXdCO0lBQUUsRUFBN0IiLCJmaWxlIjoiL1VzZXJzL3NmcmFua2VsL2Rldi9vdXRicmFpbi9MZW9uYXJkby90ZW1wb3V0TUM0eE5UTXhOVEUwTlRZd016TTRNVEE1TndyZWRyZWQuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsIlxuLy8gU3RlcHMgU3RhZ2VzXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG4vLyogQWRkIGxlb25hcmRvIG1vZHVsZSBhcyBhIGRlcGVuZGFuY3kgdG8geW91ciBhcHBcbi8vKiBZb3UgZG9uZSFcbmV4cG9ydCBkZWZhdWx0IGFuZ3VsYXIubW9kdWxlKCdleGFtcGxlJywgWydsZW9uYXJkbyddKVxuICAgICAgICAgICAgLnJ1bihydW4pO1xuXG4vL3dlbGwgYWxtb3N0Li4uXG5mdW5jdGlvbiBydW4oJHJvb3RTY29wZSwgY29uZmlndXJhdGlvbil7XG5cbiAgLy8gQWRkaW5nIHN0YXRlc1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG4gIC8vKiB2aWEgYXBpIC0geW91IGNhbiBsb29rIGF0IHRoZSByZXN1bHRzIGJ5IGNsaWNraW5nIGxlb25hcmRvIGFuZCBsb29raW5nIGluIHRoZSBjb25maWd1cmUgdGFiXG4gIC8vKiB2aWEgdWkgLSBjb21pbmcgc29vbi4uLlxuICBjb25maWd1cmF0aW9uLmFkZFN0YXRlcyhbXG4gICAge1xuICAgICAgbmFtZTogJ3N0YXRlX2FuaW1hbHNfbm9uX2FqYXgnLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7bmFtZTogJ2dldCBraXR0ZW5zJywgZGF0YTogW1wicGVyc2lvblwiLCBcInNpZW1pXCJdfSxcbiAgICAgICAge25hbWU6ICdnZXQgZG9ncycsIGRhdGE6IFtcImxhYnJhZG9yXCJdfVxuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ3N0YXRlMScsXG4gICAgICB1cmw6ICdodHRwOi8vdXJsMS5jb20nLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7bmFtZTogJ2dldCB1cmwxIGFhYWEnLCBzdGF0dXM6IDIwMCwgZGF0YTogW1widXJsMSBhYWFcIl19LFxuICAgICAgICB7bmFtZTogJ2dldCB1cmwxIGJiYmInLCBzdGF0dXM6IDIwMCwgIGRhdGE6IFtcInVybDEgYmJiXCJdfSxcbiAgICAgICAge25hbWU6ICdnZXQgdXJsMSBjY2NjJywgc3RhdHVzOiAyMDAsICBkYXRhOiBbXCJ1cmwxIGNjY1wiXX1cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwic3RhdGUyXCIsXG4gICAgICB1cmw6ICdodHRwOi8vdXJsMi5jb20nLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7bmFtZTogJ2dldCB1cmwyIGJiYmInLCBzdGF0dXM6IDQwNCwgIGRhdGE6IFtcInVybDIgNDA0IGZhaWx1cmVcIl19XG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcInN0YXRlM1wiLFxuICAgICAgdXJsOiAnaHR0cDovL3VybDMuY29tJyxcbiAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAge25hbWU6ICdnZXQgdXJsMyBiYmJiIHdpdGggZGVsYXknLCBzdGF0dXM6IDIwMCwgIGRhdGE6IFtcInVybDMgYmJiXCJdLCBkZWxheTogMjAwMH1cbiAgICAgIF1cbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwic3RhdGUgNFwiLFxuICAgICAgb3B0aW9uczogW1xuICAgICAgICB7bmFtZTogJ2dldCB1cmw0IGJiYmInLCBkYXRhOiBbXCJ1cmw0IGJiYlwiXX1cbiAgICAgIF1cbiAgICB9XG4gIF0pO1xuXG5cbiAgLy8gU2V0dGluZyBvcHRpb25zXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cbiAgLy8qIHZpYSB1aSAtIGNsaWNrIG9uIGxlb25hcmRvIGFuZCBoaXQgdGhlIGFjdGl2YXRlIHRhYnNcbiAgLy8qIHZpYSBhcGkgLSBjb21pbmcgc29vbi4uLlxuXG5cbiAgJHJvb3RTY29wZS5zaG93QW5pbWFscyA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIG9wdGlvbiA9IGNvbmZpZ3VyYXRpb24uZ2V0U3RhdGUoXCJzdGF0ZV9hbmltYWxzX25vbl9hamF4XCIpO1xuICAgIGFsZXJ0KG9wdGlvbiA/IG9wdGlvbi5kYXRhIDogJ05vIEFjdGl2ZScgKTtcbiAgfTtcbn1cbiJdfQ==
